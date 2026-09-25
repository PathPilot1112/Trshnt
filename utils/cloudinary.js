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
 * Uploads an image to Cloudinary.
 * Accepts either a Buffer (from multer memoryStorage) or a local file path.
 * @param {Buffer|string} bufferOrPath - Image buffer or local file path.
 * @returns {Promise<string>} - The secure URL of the uploaded image.
 */
export const uploadToCloudinary = async (bufferOrPath) => {
  if (!isCloudinaryConfigured) {
    if (Buffer.isBuffer(bufferOrPath)) {
      return `data:image/jpeg;base64,${bufferOrPath.toString('base64')}`;
    }
    return bufferOrPath;
  }

  if (Buffer.isBuffer(bufferOrPath)) {
    // memoryStorage path: stream the buffer to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'treasure_hunt_submissions' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      uploadStream.end(bufferOrPath);
    });
  } else {
    // Legacy diskStorage path: upload from local file
    const result = await cloudinary.uploader.upload(bufferOrPath, {
      folder: 'treasure_hunt_submissions',
    });
    return result.secure_url;
  }
};

export { isCloudinaryConfigured };

