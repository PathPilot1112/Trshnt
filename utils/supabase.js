import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET || 'images';

// Also validate that the key isn't a placeholder value
export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseKey &&
  supabaseKey !== 'hello' &&
  supabaseKey.length > 20
);

let supabase;
if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("🌲 Supabase client initialized. Target bucket:", supabaseBucket);
} else {
  console.log("ℹ️ Supabase credentials not fully configured. Falling back to other storage providers.");
}

/**
 * Uploads an image buffer to Supabase storage.
 * Accepts either a Buffer (from multer memoryStorage) or a local file path (legacy).
 * @param {Buffer|string} bufferOrPath - The image buffer or a path string (fallback).
 * @param {string} [originalName] - Optional original filename for extension detection.
 * @returns {Promise<string>} - The public URL of the uploaded image.
 */
export const uploadToSupabase = async (bufferOrPath, originalName = 'upload.jpg') => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase credentials are not configured');
  }

  let fileBuffer;
  let fileName;

  if (Buffer.isBuffer(bufferOrPath)) {
    // memoryStorage path: buffer passed directly
    const ext = path.extname(originalName) || '.jpg';
    fileName = `${Date.now()}_scan${ext}`;
    fileBuffer = bufferOrPath;
  } else {
    // Legacy diskStorage path: read file from disk
    const { default: fs } = await import('fs/promises');
    fileBuffer = await fs.readFile(bufferOrPath);
    fileName = `${Date.now()}_${path.basename(bufferOrPath)}`;
  }

  const { data, error } = await supabase.storage
    .from(supabaseBucket)
    .upload(fileName, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (error) {
    console.error("❌ Supabase upload error detail:", error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(supabaseBucket)
    .getPublicUrl(fileName);

  return publicUrl;
};
