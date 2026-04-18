import { createClient } from "@supabase/supabase-js";
import multer from "multer";

const supabaseUrl = process.env.SUPABASE_URL;
// 🔥 FIXED: Now using the master service key!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// 1. Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Configure Multer to store files in RAM
export const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
});

// 3. Helper function to upload
export const uploadImageToSupabase = async (file, folderName = "products") => {
    if (!file) return null;

    const fileName = `${folderName}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

    const { data, error } = await supabase.storage
        .from('zoykah_bucket')
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });

    if (error) {
        throw new Error(`Supabase Upload Error: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
        .from('zoykah_bucket')
        .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
};