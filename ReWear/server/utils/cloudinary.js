import { v2 as cloudinary } from "cloudinary";

let configured = false;

const configure = () => {
  if (configured) return;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  configured = true;
};

// Uploads an already-moderated image and returns { url, publicId }
export const uploadImage = async (dataUrl) => {
  configure();

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: "rewear/products",
    resource_type: "image",
    // Shrink huge phone photos on the way in
    transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto" }],
  });

  return { url: result.secure_url, publicId: result.public_id };
};
