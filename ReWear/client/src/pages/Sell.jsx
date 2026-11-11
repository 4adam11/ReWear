import { useState, useEffect } from "react";
import axios from "axios";
import { DateRange } from "react-date-range";
import { useNavigate, useParams } from "react-router-dom";

import {
  Upload,
  X,
  ImagePlus,
  Shirt,
  LoaderCircle,
  CircleCheck,
  TriangleAlert,
  Sparkles,
} from "lucide-react";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

import API from "../utils/api";
import { resizeImage, thumb, PLACEHOLDER_IMAGE } from "../utils/image";
import { CATEGORIES, SIZES, CONDITIONS, MEASUREMENTS, categoryLabel } from "../utils/catalog";
import { suggestOccasion } from "../utils/suggest";

import { format } from "date-fns";
import usePageTitle from "../hooks/usePageTitle";

const MAX_IMAGES = 6;

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const Sell = () => {
  usePageTitle("List an item");
  const navigate = useNavigate();

  // /sell/:id edits an existing listing; /sell creates a new one
  const { id: editId } = useParams();

  const [mode, setMode] =
    useState("both");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({
      title: "",
      description: "",
      category: "party",
      size: "M",
      price: "",
      rent: "",
      condition: "New",
      fabric: "",
      measurements: { bust: "", waist: "", hips: "", length: "", shoulder: "" },
    });

  // "indian" or "western", guessed from the first photo by the server's AI check
  const [photoStyle, setPhotoStyle] = useState(null);

  // Until the seller picks an occasion themselves, it follows the title and photo
  const [occasionTouched, setOccasionTouched] = useState(false);

  // Each photo: { id, preview, url, status: "checking" | "ok" | "rejected", message }
  const [images, setImages] =
    useState([]);

  const approvedImages = images.filter(
    (img) => img.status === "ok"
  );

  const [dateRange, setDateRange] =
    useState([
      {
        startDate: new Date(),
        endDate: new Date(),
        key: "selection",
      },
    ]);

  // USER
  const getUser = () =>
    JSON.parse(
      localStorage.getItem("user")
    );

  // EDIT MODE: load the listing and fill in the form
  useEffect(() => {
    if (!editId) return;

    const user = getUser();

    axios
      .get(`${API}/products/${editId}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      .then(({ data }) => {
        setMode(data.mode === "sale" ? "sell" : data.mode);
        setForm({
          title: data.title || "",
          description: data.description || "",
          category: data.category || "party",
          size: data.size || "M",
          price: data.price ?? "",
          rent: data.rent ?? "",
          condition: data.condition || "New",
          fabric: data.fabric || "",
          measurements: Object.fromEntries(
            MEASUREMENTS.map(({ key }) => [key, data.measurements?.[key] ?? ""])
          ),
        });
        setImages(
          (data.images || []).map((url, i) => ({
            id: `existing-${i}`,
            preview: thumb(url, 400),
            url,
            status: "ok",
          }))
        );
        if (data.availability?.startDate && data.availability?.endDate) {
          setDateRange([
            {
              startDate: new Date(data.availability.startDate),
              endDate: new Date(data.availability.endDate),
              key: "selection",
            },
          ]);
        }
      })
      .catch(() => setError("Could not load this listing"));
  }, [editId]);

  // New listings only: suggest an occasion until the seller chooses one
  const suggestion =
    !editId && !occasionTouched
      ? suggestOccasion({ title: form.title, description: form.description, style: photoStyle })
      : null;
  const category = suggestion?.category || form.category;

  // INPUT
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });

    setError("");
  };

  const updateImage = (id, changes) =>
    setImages((prev) =>
      prev.map((img) =>
        img.id === id
          ? { ...img, ...changes }
          : img
      )
    );

  // CHECK ONE PHOTO ON THE SERVER (clothing only, nothing explicit), THEN STORE IT
  const uploadPhoto = async (file, id) => {
    const user = getUser();

    try {
      const preview =
        await resizeImage(file);

      updateImage(id, { preview });

      const { data } =
        await axios.post(
          `${API}/uploads`,
          { image: preview },
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );

      updateImage(id, {
        status: "ok",
        url: data.url,
        // The AI wasn't sure about this photo: allowed, but an admin will look closely
        aiNote: data.aiNote,
      });

      // First hint wins: later photos are usually close-ups of the same item
      if (data.suggestion?.style) {
        setPhotoStyle((current) => current || data.suggestion.style);
      }
    } catch (err) {
      updateImage(id, {
        status: "rejected",
        message:
          err.response?.data
            ?.message ||
          "Upload failed, please try again",
      });
    }
  };

  // IMAGE UPLOAD
  const handleImageUpload = (e) => {
    const files = Array.from(
      e.target.files
    );

    // Let the same file be picked again after removing it
    e.target.value = "";

    const slots =
      MAX_IMAGES - images.length;

    if (files.length > slots) {
      setError(
        `You can add ${slots} more photo${slots === 1 ? "" : "s"} (maximum ${MAX_IMAGES})`
      );
    }

    files
      .slice(0, Math.max(slots, 0))
      .forEach((file) => {
        const id = `${Date.now()}-${Math.random()}`;

        if (
          !ACCEPTED_TYPES.includes(
            file.type
          )
        ) {
          setImages((prev) => [
            ...prev,
            {
              id,
              preview: "",
              status: "rejected",
              message:
                "Only JPEG, PNG or WebP photos",
            },
          ]);

          return;
        }

        setImages((prev) => [
          ...prev,
          {
            id,
            preview: "",
            status: "checking",
          },
        ]);

        uploadPhoto(file, id);
      });
  };

  // REMOVE IMAGE
  const handleRemoveImage = (
    id
  ) => {
    setImages((prev) =>
      prev.filter(
        (img) => img.id !== id
      )
    );
  };

  // SUBMIT
  const handleSubmit = async () => {
    const user = getUser();

    if (!user) {
      alert("Please login first");

      navigate("/login");

      return;
    }

    if (
      images.some(
        (img) =>
          img.status === "checking"
      )
    ) {
      setError(
        "Please wait until your photos have been checked"
      );

      return;
    }

    if (
      images.some(
        (img) =>
          img.status === "rejected"
      )
    ) {
      setError(
        "Remove the rejected photos before listing"
      );

      return;
    }

    if (
      !form.title ||
      approvedImages.length === 0
    ) {
      setError(
        "Title and at least 1 image required"
      );

      return;
    }

    try {
      setLoading(true);

      const payload = {
          title: form.title,
          description: form.description,
          images: approvedImages.map(
            (img) => img.url
          ),
          price: Number(
            form.price
          ),
          rent: Number(form.rent),
          mode,
          category,
          size: form.size,
          condition:
            form.condition,
          fabric: form.fabric,
          measurements: form.measurements,
          // Calendar days, so time zones can't shift them
          availability: {
            startDate: format(dateRange[0].startDate, "yyyy-MM-dd"),
            endDate: format(dateRange[0].endDate, "yyyy-MM-dd"),
          },
      };

      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      if (editId) {
        const { data } = await axios.put(`${API}/products/${editId}`, payload, config);
        alert(data.message);
      } else {
        await axios.post(`${API}/products`, payload, config);
        alert("Listing submitted for review. You'll get a notification when an admin approves it.");
      }

      navigate("/seller/listings");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data
          ?.message ||
        "Failed to list product"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6">

      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* HEADER */}
        <div className="mb-8">

          <h1 className="page-title">
            {editId ? "Edit listing" : "List an item"}
          </h1>

          <p className="mt-2 text-sm text-muted">
            {editId
              ? "Price changes go live straight away. New photos or details are re-checked by an admin."
              : "Upload your fashion item for sale or rent. An admin reviews every listing before it goes live."}
          </p>

        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* GRID */}
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">

          {/* LEFT */}
          <div className="space-y-6">

            {/* MODE */}
            <div className="bg-white border border-line rounded-sm p-5">

              <p className="text-sm font-medium text-gray-700 mb-4">
                How do you want to list it?
              </p>

              <div className="grid grid-cols-3 bg-[#efe6da] rounded-md p-1">

                {[
                  "sell",
                  "rent",
                  "both",
                ].map((m) => (
                  <button
                    key={m}

                    onClick={() =>
                      setMode(m)
                    }

                    className={`h-9 rounded text-sm font-semibold transition ${mode === m ? "bg-white text-ink" : "text-muted hover:text-ink"
                      }`}
                  >
                    {m === "sell" ? "Sell" : m === "rent" ? "Rent" : "Sell and rent"}
                  </button>
                ))}

              </div>

            </div>

            {/* UPLOAD */}
            <div className="bg-white border border-line rounded-sm p-5">

              <div className="flex items-center gap-2 mb-5">

                <ImagePlus
                  size={20}
                  className="text-ink"
                />

                <h2 className="text-lg font-medium text-ink">
                  Photos
                </h2>

              </div>

              {/* DROPZONE */}
              <label className="border-2 border-dashed border-line rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand transition">

                <Upload
                  size={28}
                  className="text-gray-400"
                />

                <p className="mt-4 text-sm font-medium text-gray-700">
                  Click to upload images
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Maximum 6 images · clothing photos only
                </p>

                <input
                  type="file"
                  multiple
                  accept={ACCEPTED_TYPES.join(",")}
                  className="hidden"
                  onChange={
                    handleImageUpload
                  }
                />

              </label>

              {/* PREVIEWS */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-5">

                  {images.map(
                    (img) => (
                      <div
                        key={img.id}
                        className={`relative rounded-lg overflow-hidden border ${img.status === "rejected"
                            ? "border-red-300"
                            : "border-line"
                          }`}
                      >

                        {img.preview ? (
                          <img
                            src={img.preview}
                            alt="preview"
                            className={`w-full h-28 object-contain bg-cream ${img.status === "ok"
                                ? ""
                                : "opacity-40"
                              }`}
                          />
                        ) : (
                          <div className="w-full h-28 bg-cream" />
                        )}

                        {/* CHECK STATUS */}
                        {img.status === "checking" && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-gray-600">
                            <LoaderCircle
                              size={18}
                              className="animate-spin"
                            />
                            <span className="mt-1">
                              Checking…
                            </span>
                          </div>
                        )}

                        {img.status === "ok" && !img.aiNote && (
                          <CircleCheck
                            size={18}
                            className="absolute bottom-2 left-2 text-green-500 bg-white rounded-full"
                          />
                        )}

                        {/* AI unsure: allowed, but flagged for the admin */}
                        {img.status === "ok" && img.aiNote && (
                          <div
                            title={img.aiNote}
                            className="absolute bottom-0 inset-x-0 bg-orange-500/90 text-white text-[10px] leading-tight px-1.5 py-1 text-center"
                          >
                            AI flagged: an admin will check this photo
                          </div>
                        )}

                        {img.status === "rejected" && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center text-[11px] leading-tight text-red-600 bg-white/70">
                            <TriangleAlert size={16} />
                            <span className="mt-1">
                              {img.message}
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() =>
                            handleRemoveImage(
                              img.id
                            )
                          }

                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                        >
                          <X size={14} />
                        </button>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

            {/* DETAILS */}
            <div className="bg-white border border-line rounded-sm p-5 space-y-5">

              <div>

                <label className="text-sm font-medium text-gray-700">
                  Title
                </label>

                <input
                  name="title"
                  placeholder="e.g. Red Banarasi silk saree"

                  value={form.title}

                  className="w-full mt-2 border border-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"

                  onChange={
                    handleChange
                  }
                />

              </div>

              <div>

                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  name="description"
                  rows={4}
                  maxLength={2000}
                  placeholder="Fabric, fit, how many times it was worn, any marks or alterations…"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full mt-2 border border-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                />

              </div>

              {/* GRID */}
              <div className="grid sm:grid-cols-3 gap-4">

                {/* CATEGORY */}
                <div>

                  <label htmlFor="sell-occasion" className="text-sm font-medium text-gray-700">
                    Occasion
                  </label>

                  <select
                    id="sell-occasion"
                    value={category}

                    onChange={(e) => {
                      setOccasionTouched(true);
                      setForm({
                        ...form,
                        category:
                          e.target.value.toLowerCase(),
                      });
                    }}

                    className="w-full mt-2 border border-line rounded-lg px-4 py-3 text-sm focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}

                  </select>

                </div>

                {/* SIZE */}
                <div>

                  <label className="text-sm font-medium text-gray-700">
                    Size
                  </label>

                  <select
                    name="size"

                    value={form.size}

                    onChange={
                      handleChange
                    }

                    className="w-full mt-2 border border-line rounded-lg px-4 py-3 text-sm focus:outline-none"
                  >
                    {SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}

                  </select>

                </div>

                {/* CONDITION */}
                <div>

                  <label className="text-sm font-medium text-gray-700">
                    Condition
                  </label>

                  <select
                    name="condition"

                    value={
                      form.condition
                    }

                    onChange={
                      handleChange
                    }

                    className="w-full mt-2 border border-line rounded-lg px-4 py-3 text-sm focus:outline-none"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}

                  </select>

                </div>

              </div>

            </div>

            {/* WHY THIS OCCASION WAS PICKED */}
            {suggestion && (
              <p role="status" className="-mt-3 flex items-start gap-2 text-[13px] text-muted">
                <Sparkles size={15} className="text-accent flex-shrink-0 mt-0.5" />
                <span>
                  Occasion set to <strong className="text-ink">{categoryLabel(suggestion.category)}</strong>{" "}
                  {suggestion.source === "title"
                    ? "from the words in your listing."
                    : `because your photo looks like ${photoStyle === "indian" ? "Indian" : "western"} wear.`}{" "}
                  Change it above if that's wrong.
                </span>
              </p>
            )}

            {/* FABRIC + MEASUREMENTS */}
            <div className="bg-white border border-line rounded-sm p-5 space-y-4">

              <div>
                <p className="text-sm font-medium text-gray-700">Fabric and measurements</p>
                <p className="mt-0.5 text-xs text-muted">
                  Optional, but buyers trust listings that have them. Lay the garment flat and measure in inches.
                </p>
              </div>

              <div>
                <label htmlFor="sell-fabric" className="text-xs font-medium text-gray-700">Fabric</label>
                <input
                  id="sell-fabric"
                  name="fabric"
                  maxLength={60}
                  placeholder="e.g. Banarasi silk, cotton, georgette"
                  value={form.fabric}
                  onChange={handleChange}
                  className="w-full mt-1.5 border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {MEASUREMENTS.map(({ key, label }) => (
                  <div key={key}>
                    <label htmlFor={`sell-m-${key}`} className="text-xs font-medium text-gray-700">{label}</label>
                    <div className="relative mt-1.5">
                      <input
                        id={`sell-m-${key}`}
                        type="number"
                        inputMode="decimal"
                        min="1"
                        max="120"
                        step="0.5"
                        value={form.measurements[key]}
                        onChange={(e) =>
                          setForm({ ...form, measurements: { ...form.measurements, [key]: e.target.value } })
                        }
                        className="w-full border border-line rounded-lg pl-3 pr-8 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted" aria-hidden="true">in</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* SELL */}
            {(mode === "sell" ||
              mode === "both" ||
              mode === "sale") && (
                <div className="bg-white border border-line rounded-sm p-5">

                  <label className="text-sm font-medium text-gray-700">
                    Sale price (₹)
                  </label>

                  <input
                    name="price"
                    placeholder="e.g. 2500"

                    type="number"

                    value={form.price}

                    className="w-full mt-2 border border-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"

                    onChange={
                      handleChange
                    }
                  />

                </div>
              )}

            {/* RENT */}
            {(mode === "rent" ||
              mode === "both") && (
                <div className="bg-white border border-line rounded-sm p-5">

                  <label className="text-sm font-medium text-gray-700">
                    Rent per day (₹)
                  </label>

                  <input
                    name="rent"
                    placeholder="e.g. 300"

                    type="number"

                    value={form.rent}

                    className="w-full mt-2 mb-5 border border-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"

                    onChange={
                      handleChange
                    }
                  />

                  {/* CALENDAR */}
                  <p className="text-sm font-medium text-ink">When can it be rented?</p>
                  <p className="mt-0.5 mb-2 text-xs text-muted">
                    Pick the dates you're happy to lend it out. Leave a single day selected to allow any dates.
                  </p>
                  <div className="border border-line rounded-lg overflow-hidden flex justify-center">

                    <DateRange
                      ranges={dateRange}
                      rangeColors={["#6b4430"]}
                      minDate={new Date()}

                      onChange={(
                        item
                      ) =>
                        setDateRange([
                          item.selection,
                        ])
                      }
                    />

                  </div>

                </div>
              )}

            {/* SUBMIT */}
            <button
              disabled={loading}

              onClick={handleSubmit}

              className="btn btn-dark w-full"
            >
              {loading
                ? "Saving..."
                : editId
                  ? "Save changes"
                  : "Submit for review"}
            </button>

          </div>

          {/* RIGHT */}
          <div className="lg:sticky lg:top-24">

            <div className="bg-white border border-line rounded-sm p-5">

              <div className="flex items-center gap-2 mb-5">

                <Shirt
                  size={20}
                  className="text-ink"
                />

                <h2 className="text-lg font-medium text-ink">
                  Preview
                </h2>

              </div>

              {/* CARD */}
              <div className="border border-line rounded-lg overflow-hidden">

                <img
                  src={
                    approvedImages[0]?.preview ||
                    PLACEHOLDER_IMAGE
                  }

                  alt="preview"

                  className="w-full h-[400px] object-contain bg-cream"
                />

                <div className="p-5">

                  <h3 className="text-xl font-medium text-ink">
                    {form.title ||
                      "Your item title"}
                  </h3>

                  <p className="mt-2 text-sm text-muted capitalize">
                    {categoryLabel(category)} •{" "}
                    {form.size}
                  </p>

                  <div className="mt-5 flex items-center justify-between">

                    <div>

                      <p className="text-sm text-muted">
                        Price
                      </p>

                      <p className="text-2xl font-semibold text-ink">
                        ₹{" "}
                        {form.price ||
                          form.rent ||
                          0}
                      </p>

                    </div>

                    <div className="px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                      {form.condition}
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Sell;