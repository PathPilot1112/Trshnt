import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET || 'images';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

let supabase;
if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("🌲 Supabase client initialized. Target bucket:", supabaseBucket);
} else {
  console.log("ℹ️ Supabase credentials not fully configured. Falling back to other storage providers.");
}

/**
 * Uploads a local file to Supabase storage.
 * @param {string} localFilePath - Path to the local file.
 * @returns {Promise<string>} - The public URL of the uploaded image.
 */
export const uploadToSupabase = async (localFilePath) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase credentials are not configured');
  }

  const fileBuffer = await fs.readFile(localFilePath);
  const fileName = `${Date.now()}_${path.basename(localFilePath)}`;

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
