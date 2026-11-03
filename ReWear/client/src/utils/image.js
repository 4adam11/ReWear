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

// Asks Cloudinary for a resized, compressed copy (WebP/AVIF where supported)
// instead of the full-size original. Other URLs are returned unchanged.
export const thumb = (url, width = 600) =>
  typeof url === "string" && url.includes("res.cloudinary.com") && url.includes("/upload/")
    ? url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`)
    : url;

// Local placeholder (the old via.placeholder.com service no longer exists)
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="#efeee8"/><path d="M150 150a18 18 0 1 1 18 18v14l70 42a10 10 0 0 1-5 19H67a10 10 0 0 1-5-19l70-42" fill="none" stroke="#a8b5a2" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  );
