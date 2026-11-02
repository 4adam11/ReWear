import { pipeline, RawImage, env } from "@huggingface/transformers";

// Both models run locally (no API keys). They download from Hugging Face once,
// on first use, and are cached on disk after that.

// Default cache is inside node_modules; a short path avoids Windows' 260-character
// path limit (the ONNX runtime can't open model files past it) and survives reinstalls.
if (process.env.MODEL_CACHE_DIR) {
  env.cacheDir = process.env.MODEL_CACHE_DIR;
}
const NSFW_MODEL = process.env.NSFW_MODEL || "AdamCodd/vit-base-nsfw-detector";
const CLIP_MODEL = process.env.CLIP_MODEL || "Xenova/clip-vit-base-patch32";

// The NSFW detector also flags fitted party/evening wear (straps, necklines) as
// "suggestive", so it's combined with CLIP instead of used on its own:
// - at or above NSFW_THRESHOLD: always rejected
// - between NSFW_SOFT_THRESHOLD and NSFW_THRESHOLD: rejected unless CLIP clearly sees clothing
const NSFW_THRESHOLD = Number(process.env.NSFW_THRESHOLD || 0.9);
const NSFW_SOFT_THRESHOLD = Number(process.env.NSFW_SOFT_THRESHOLD || 0.6);
const CLEAR_CLOTHING = Number(process.env.CLEAR_CLOTHING || 0.7);
// Accept only when CLIP puts at least this much weight on the clothing labels
const CLOTHING_THRESHOLD = Number(process.env.CLOTHING_THRESHOLD || 0.5);
// Second explicit-content check, from CLIP, in case the detector misses something
const CLIP_EXPLICIT_THRESHOLD = Number(process.env.CLIP_EXPLICIT_THRESHOLD || 0.3);

// CLIP compares the photo against all of these and the scores add up to 1.
// Edit the lists to change what counts as a valid listing photo.
const LABELS = {
  clothing: [
    "a piece of clothing",
    "a dress or gown",
    "a shirt, t-shirt or top",
    "trousers, jeans or a skirt",
    "a jacket, coat or hoodie",
    "a saree, lehenga, kurta or sherwani",
    "a person modelling an outfit",
    "a pair of shoes",
  ],
  explicit: [
    "nudity or sexually explicit content",
  ],
  other: [
    "food",
    "an animal",
    "a car or vehicle",
    "a landscape or building",
    "a screenshot or document with text",
    "a close-up selfie of a face",
    "furniture or a room",
    "a phone, laptop or other electronics",
    "a meme, cartoon or drawing",
  ],
};

const ALL_LABELS = Object.values(LABELS).flat();

let modelsPromise;

export const loadModels = () => {
  if (!modelsPromise) {
    modelsPromise = Promise.all([
      // Quantized (8-bit) versions: ~4x smaller downloads and memory, near-identical accuracy
      pipeline("image-classification", NSFW_MODEL, { dtype: "q8" }),
      pipeline("zero-shot-image-classification", CLIP_MODEL, { dtype: "q8" }),
    ])
      .then(([nsfw, clip]) => ({ nsfw, clip }))
      .catch((err) => {
        // Allow a retry on the next upload instead of caching the failure
        modelsPromise = undefined;
        throw err;
      });
  }

  return modelsPromise;
};

const groupScore = (results, group) =>
  results
    .filter((r) => LABELS[group].includes(r.label))
    .reduce((sum, r) => sum + r.score, 0);

// Returns { ok: true, scores } or { ok: false, reason, message, scores }
export const moderateImage = async (buffer) => {
  const { nsfw, clip } = await loadModels();

  const image = await RawImage.fromBlob(new Blob([buffer]));

  const nsfwResults = await nsfw(image, { top_k: 2 });
  const nsfwScore =
    nsfwResults.find((r) => r.label.toLowerCase() === "nsfw")?.score ?? 0;

  const clipResults = await clip(image, ALL_LABELS);

  const scores = {
    nsfw: nsfwScore,
    explicit: groupScore(clipResults, "explicit"),
    clothing: groupScore(clipResults, "clothing"),
    topLabel: clipResults[0]?.label,
  };

  const explicit =
    scores.nsfw >= NSFW_THRESHOLD ||
    (scores.nsfw >= NSFW_SOFT_THRESHOLD && scores.clothing < CLEAR_CLOTHING) ||
    scores.explicit >= CLIP_EXPLICIT_THRESHOLD;

  if (explicit) {
    return {
      ok: false,
      reason: "explicit",
      message: "This photo looks inappropriate and can't be used.",
      scores,
    };
  }

  if (scores.clothing < CLOTHING_THRESHOLD) {
    return {
      ok: false,
      reason: "not_clothing",
      message: "Please upload a photo of the clothing item you're listing.",
      scores,
    };
  }

  return { ok: true, scores };
};
