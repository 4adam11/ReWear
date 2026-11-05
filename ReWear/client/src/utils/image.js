// Shrinks a photo in the browser before upload so large phone pictures
// stay under the server's 5 MB limit and upload quickly.
export const resizeImage = (file, maxSize = 1600, quality = 0.85) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");

      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };

    img.src = url;
  });

const isCloudinary = (url) => typeof url === "string" && url.includes("res.cloudinary.com") && url.includes("/upload/");

// Cloudinary does the photo work on the fly (originals are never changed):
//   e_improve      automatic colour, contrast and exposure correction
//   e_sharpen      a light sharpen so fabric texture reads at small sizes
//   f_auto/q_auto  WebP/AVIF at a "good" quality where the browser supports it
const ENHANCE = "e_improve,e_sharpen:30,f_auto,q_auto:good";

const transform = (url, t) => (isCloudinary(url) ? url.replace("/upload/", `/upload/${t}/`) : url);

// Resized whole photo (no cropping), e.g. the main product image or small thumbnails
export const thumb = (url, width = 600) => transform(url, `${ENHANCE},c_limit,w_${width}`);

// Product-card crop: every card the same 3:4 shape, with the garment kept in frame (g_auto)
export const cardImage = (url, width = 400) => transform(url, `${ENHANCE},c_fill,g_auto,ar_3:4,w_${width}`);

// Sharper photos on high-resolution (retina) screens
export const cardSrcSet = (url, width = 400) =>
  isCloudinary(url) ? `${cardImage(url, width)} 1x, ${cardImage(url, width * 2)} 2x` : undefined;

export const photoSrcSet = (url, width = 900) =>
  isCloudinary(url) ? `${thumb(url, width)} 1x, ${thumb(url, Math.min(width * 2, 2000))} 2x` : undefined;

// Local placeholder (the old via.placeholder.com service no longer exists)
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="#f3ebe0"/><path d="M150 150a18 18 0 1 1 18 18v14l70 42a10 10 0 0 1-5 19H67a10 10 0 0 1-5-19l70-42" fill="none" stroke="#c9a184" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  );
