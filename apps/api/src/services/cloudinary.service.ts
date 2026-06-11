import crypto from "node:crypto";
import { env } from "../config/env.js";

const DATA_FILE_PATTERN = /^data:[\w/+.-]+;base64,/i;
const DATA_IMAGE_PATTERN = /^data:image\/(?:png|jpe?g|webp|gif);base64,/i;

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  error?: {
    message?: string;
  };
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isCloudinaryConfigured() {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

function getUploadFolder(folder: string) {
  const rootFolder = "pipnest";
  return `${rootFolder}/${folder}`.replace(/\/+/g, "/");
}

function signUpload(params: Record<string, string>) {
  const signatureBase = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${signatureBase}${env.CLOUDINARY_API_SECRET}`)
    .digest("hex");
}

async function uploadDataFile(dataUrl: string, folder: string, resourceType: "auto" | "image" = "auto") {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const uploadFolder = getUploadFolder(folder);
  const signature = signUpload({ folder: uploadFolder, timestamp });
  const formData = new FormData();

  formData.append("file", dataUrl);
  formData.append("api_key", env.CLOUDINARY_API_KEY!);
  formData.append("timestamp", timestamp);
  formData.append("folder", uploadFolder);
  formData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, {
    method: "POST",
    body: formData
  });
  const result = (await response.json()) as CloudinaryUploadResponse;

  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || `Cloudinary upload failed with status ${response.status}`);
  }

  return result.secure_url;
}

export async function uploadAvatarImage(value: string | null | undefined) {
  if (!value) return null;
  if (!DATA_IMAGE_PATTERN.test(value)) return value;

  if (!isCloudinaryConfigured()) {
    console.warn("Cloudinary is not configured. Avatar image will be stored without Cloudinary upload.");
    return value;
  }

  try {
    return await uploadDataFile(value, "avatars", "image");
  } catch (error) {
    console.error(`Avatar image upload failed: ${getErrorMessage(error)}`);
    return value;
  }
}

export async function uploadSupportAttachments(values: string[] | null | undefined) {
  if (!values?.length) return [];

  const uploaded: string[] = [];
  for (const value of values.slice(0, 4)) {
    if (!value) continue;
    if (!DATA_FILE_PATTERN.test(value)) {
      uploaded.push(value);
      continue;
    }

    if (!isCloudinaryConfigured()) {
      console.warn("Cloudinary is not configured. Support attachment will be stored without Cloudinary upload.");
      uploaded.push(value);
      continue;
    }

    try {
      uploaded.push(await uploadDataFile(value, "support", "auto"));
    } catch (error) {
      console.error(`Support attachment upload failed: ${getErrorMessage(error)}`);
    }
  }

  return uploaded;
}

export async function uploadKycDocument(value: string) {
  if (!DATA_FILE_PATTERN.test(value)) return value;

  if (!isCloudinaryConfigured()) {
    console.warn("Cloudinary is not configured. KYC document will be stored without Cloudinary upload.");
    return value;
  }

  try {
    return await uploadDataFile(value, "kyc", "auto");
  } catch (error) {
    console.error(`KYC document upload failed: ${getErrorMessage(error)}`);
    throw error;
  }
}

export async function uploadTopUpProof(value: string | null | undefined) {
  if (!value) return null;
  if (!DATA_FILE_PATTERN.test(value)) return value;

  if (!isCloudinaryConfigured()) {
    console.warn("Cloudinary is not configured. Top-up proof will be stored without Cloudinary upload.");
    return value;
  }

  try {
    return await uploadDataFile(value, "topups", "auto");
  } catch (error) {
    console.error(`Top-up proof upload failed: ${getErrorMessage(error)}`);
    return null;
  }
}

export async function uploadManualFundingAccountImage(value: string | null | undefined) {
  if (!value) return null;
  if (!DATA_IMAGE_PATTERN.test(value)) return value;

  if (!isCloudinaryConfigured()) {
    console.warn("Cloudinary is not configured. Manual funding account image will be stored without Cloudinary upload.");
    return value;
  }

  try {
    return await uploadDataFile(value, "funding-accounts", "image");
  } catch (error) {
    console.error(`Manual funding account image upload failed: ${getErrorMessage(error)}`);
    return null;
  }
}

export async function uploadBlogImage(value: string | null | undefined) {
  if (!value) return null;
  if (!DATA_IMAGE_PATTERN.test(value)) return value;

  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured. Blog images must be uploaded to Cloudinary.");
  }

  try {
    return await uploadDataFile(value, "blogs/images", "image");
  } catch (error) {
    console.error(`Blog image upload failed: ${getErrorMessage(error)}`);
    throw error;
  }
}

export async function uploadBlogMedia(value: string | null | undefined) {
  if (!value) return null;
  if (!DATA_FILE_PATTERN.test(value)) return value;

  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured. Blog media must be uploaded to Cloudinary.");
  }

  try {
    return await uploadDataFile(value, "blogs/media", "auto");
  } catch (error) {
    console.error(`Blog media upload failed: ${getErrorMessage(error)}`);
    throw error;
  }
}

export async function uploadBlogCommentImages(values: string[] | null | undefined) {
  if (!values?.length) return [];

  const uploaded: string[] = [];
  for (const value of values.slice(0, 4)) {
    const imageUrl = await uploadBlogImage(value);
    if (imageUrl) uploaded.push(imageUrl);
  }
  return uploaded;
}
