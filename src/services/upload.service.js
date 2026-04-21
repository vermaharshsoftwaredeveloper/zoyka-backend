import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getSupabaseClient } from "../config/supabase.js";
import { SUPABASE_BUCKET, SUPABASE_URL } from "../config/env.js";
import { API_BASE_URL } from "../config/env.js";

/**
 * Supabase Storage Folder Structure:
 *   zoykah_bucket/
 *     outlets/       — outlet images
 *     staff/         — operational manager avatars
 *     artisans/      — artisan avatars
 *     reviews/       — review images
 *     banners/       — banner images
 *     testimonials/  — testimonial customer images
 *     products/      — product images
 *     profiles/      — user profile avatars
 *     bulk-inquiries/ — bulk order reference images
 */

/**
 * Upload a base64 image to Supabase Storage (primary) or local disk (fallback).
 * If input is already a URL, returns it as-is.
 * 
 * @param {string} base64String - Full data URI (data:image/png;base64,...) or URL
 * @param {string} folder - Subfolder in the bucket (e.g. "outlets", "reviews")
 * @param {string} [prefix="img"] - Filename prefix (e.g. "outlet", "artisan")
 * @returns {Promise<string>} Public URL of the uploaded image
 */
export const uploadImage = async (base64String, folder = "uploads", prefix = "img") => {
  if (!base64String || typeof base64String !== "string") {
    throw new Error("Invalid image data");
  }

  // Parse base64 data URI
  const matches = base64String.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!matches) {
    // If it's already a URL, return it as-is
    if (base64String.startsWith("http://") || base64String.startsWith("https://")) {
      return base64String;
    }
    throw new Error("Invalid image format. Expected base64 data URI or URL.");
  }

  const mime = matches[1];
  const ext = mime.split("/")[1].split("+")[0];
  const data = matches[2];
  const buffer = Buffer.from(data, "base64");

  // Validate file type
  const allowedTypes = ["png", "jpg", "jpeg", "gif", "webp"];
  if (!allowedTypes.includes(ext.toLowerCase())) {
    throw new Error("Unsupported image type. Allowed: png, jpg, jpeg, gif, webp");
  }

  // Validate file size (2MB max)
  if (buffer.length > 2 * 1024 * 1024) {
    throw new Error("Image too large. Maximum size is 2MB.");
  }

  const filename = `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${ext}`;

  // Try Supabase Storage first
  const supabase = getSupabaseClient();
  if (supabase) {
    const filePath = `${folder}/${filename}`;
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, buffer, {
        contentType: mime,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload failed, falling back to local:", error.message);
      return saveToLocalDisk(buffer, folder, filename);
    }

    // Return public URL
    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  // Fallback to local disk
  return saveToLocalDisk(buffer, folder, filename);
};

/**
 * Delete an image from Supabase Storage (or local disk).
 * Silently ignores errors — deletion is best-effort cleanup.
 * 
 * @param {string} imageUrl - The full public URL of the image to delete
 */
export const deleteImage = async (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") return;

  try {
    const supabase = getSupabaseClient();

    // Check if it's a Supabase URL
    if (supabase && SUPABASE_URL && imageUrl.includes(SUPABASE_URL)) {
      // Extract file path from URL: .../storage/v1/object/public/bucket_name/folder/filename
      const bucketPrefix = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;
      const idx = imageUrl.indexOf(bucketPrefix);
      if (idx !== -1) {
        const filePath = imageUrl.substring(idx + bucketPrefix.length);
        await supabase.storage.from(SUPABASE_BUCKET).remove([filePath]);
      }
      return;
    }

    // Check if it's a local URL
    if (imageUrl.includes("/api/uploads/")) {
      const uploadsIdx = imageUrl.indexOf("/api/uploads/");
      const relativePath = imageUrl.substring(uploadsIdx + "/api/uploads/".length);
      const localPath = path.join(process.cwd(), "public", "uploads", relativePath);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }
  } catch (err) {
    // Best-effort cleanup — don't throw
    console.error("Image deletion failed (non-critical):", err.message);
  }
};

/**
 * Replace an old image with a new one. Uploads the new image first,
 * then deletes the old one. If the new value is already a URL (unchanged), returns it as-is.
 * 
 * @param {string} newImage - base64 data URI or URL
 * @param {string|null} oldImageUrl - existing image URL to delete (if different)
 * @param {string} folder - storage folder
 * @param {string} prefix - filename prefix
 * @returns {Promise<string>} Public URL of the new (or unchanged) image
 */
export const replaceImage = async (newImage, oldImageUrl, folder, prefix) => {
  const newUrl = await uploadImage(newImage, folder, prefix);

  // If the URL changed (i.e. a new image was actually uploaded), delete the old one
  if (oldImageUrl && newUrl !== oldImageUrl) {
    await deleteImage(oldImageUrl);
  }

  return newUrl;
};

/**
 * Fallback: save image to local disk at public/uploads/
 */
function saveToLocalDisk(buffer, folder, filename) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);
  return `${API_BASE_URL}/api/uploads/${folder}/${filename}`;
}
