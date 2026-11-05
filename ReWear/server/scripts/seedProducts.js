// Seeds demo listings of Indian clothing from openly licensed Wikimedia Commons photos.
//
//   npm run seed            add any listings from seed/products.json that aren't there yet
//   npm run seed -- --reset remove the demo store's listings (and their Cloudinary photos) first
//
// Every photo goes through the same moderation + Cloudinary upload as a real seller's,
// and each listing's description credits the photographer and licence.
import "dotenv/config";
import fs from "node:fs";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/User.js";
import Product from "../models/Product.js";
import Upload from "../models/Upload.js";
import { moderateImage, loadModels } from "../utils/imageModeration.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import { validateProduct } from "../utils/validateProduct.js";

const STORE_EMAIL = "demo-store@rewear.local";
const UA = { "User-Agent": "ReWearStudentProject/1.0 (academic project; https://github.com/4adam11/ReWear)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const products = JSON.parse(
  fs.readFileSync(new URL("../seed/products.json", import.meta.url), "utf8")
);

const getStore = async () => {
  let store = await User.findOne({ email: STORE_EMAIL });

  if (!store) {
    // Random password nobody knows: this account only owns the demo listings
    const password = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
    store = await User.create({ name: "ReWear Demo Store", email: STORE_EMAIL, password });
  }

  return store;
};

const reset = async (store) => {
  const listings = await Product.find({ user: store._id });
  const uploads = await Upload.find({ user: store._id });

  for (const u of uploads) {
    await deleteImage(u.publicId).catch((err) => console.warn("  Cloudinary delete failed:", err.message));
  }

  await Upload.deleteMany({ user: store._id });
  await Product.deleteMany({ user: store._id });
  console.log(`Removed ${listings.length} demo listings and ${uploads.length} photos`);
};

const download = async (url) => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    await sleep(5000 * attempt);
  }
  throw new Error("download failed");
};

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const store = await getStore();

  if (process.argv.includes("--reset")) {
    await reset(store);
  }

  console.log("Loading moderation models...");
  await loadModels();

  let added = 0;
  let skipped = 0;

  for (const p of products) {
    if (await Product.exists({ user: store._id, title: p.title })) {
      skipped++;
      continue;
    }

    try {
      const buffer = await download(p.photo.url);

      // Same check as a real upload: clothing only, nothing explicit
      const verdict = await moderateImage(buffer);
      if (!verdict.ok) {
        console.log(`  REJECTED by moderation (${verdict.reason}): ${p.title}`);
        continue;
      }

      const { url, publicId } = await uploadImage(
        `data:image/jpeg;base64,${buffer.toString("base64")}`
      );

      await Upload.create({ user: store._id, url, publicId, scores: verdict.scores });

      const credit =
        `Photo: ${p.photo.artist}, ${p.photo.license}, via Wikimedia Commons (${p.photo.page}).`;

      const { error, data } = validateProduct({
        ...p,
        images: [url],
        description: `${p.description}\n\n${credit}`,
      });

      if (error) {
        console.log(`  INVALID (${error}): ${p.title}`);
        continue;
      }

      // Curated demo listings skip the admin queue
      await Product.create({
        ...data,
        user: store._id,
        status: "live",
        review: { everApproved: true, reviewedAt: new Date() },
      });
      added++;
      console.log(`  added [${p.category}] ${p.title}`);

      await sleep(500);
    } catch (err) {
      console.log(`  FAILED (${err.message}): ${p.title}`);
    }
  }

  console.log(`\nDone: ${added} added, ${skipped} already there`);
  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
