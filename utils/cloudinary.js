import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.log("ℹ️ Cloudinary credentials not configured in environment variables. Falling back to local disk storage.");
}

/**
 * Uploads a local file to Cloudinary.
 * @param {string} localFilePath - Path to the local file.
 * @returns {Promise<string>} - The secure URL of the uploaded image.
 */
export const uploadToCloudinary = async (localFilePath) => {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary credentials are not configured');
  }
  const result = await cloudinary.uploader.upload(localFilePath, {
    folder: 'treasure_hunt_submissions',
  });
  return result.secure_url;
};

export { isCloudinaryConfigured };
