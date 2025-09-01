const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const PRODUCT_IMAGES_BUCKET = process.env.SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";

let supabase = null;
let supabaseConfigured = false;

// Enhanced Supabase configuration with better error handling
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log("📸 Photo Upload Configuration:");
    console.log("⚠️  Supabase credentials are not configured.");
    console.log("💡 To enable photo uploads:");
    console.log("   1. Add SUPABASE_URL to your .env file");
    console.log("   2. Add SUPABASE_ANON_KEY to your .env file");
    console.log("   3. Restart the server");
    console.log("🔧 Photo upload endpoints will return appropriate error messages.");
    supabaseConfigured = false;
} else {
    // Validate URL format
    if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_URL.includes('.supabase.co')) {
        console.error("❌ Invalid SUPABASE_URL format. Expected: https://your-project-id.supabase.co");
        supabaseConfigured = false;
    } else if (SUPABASE_URL.includes('your-project-id') || SUPABASE_ANON_KEY.includes('your-anon-key')) {
        console.log("📸 Photo Upload Configuration:");
        console.log("⚠️  Placeholder Supabase credentials detected.");
        console.log("💡 Please replace with your actual Supabase credentials in .env file:");
        console.log("   SUPABASE_URL=https://your-actual-project-id.supabase.co");
        console.log("   SUPABASE_ANON_KEY=your-actual-anon-key");
        supabaseConfigured = false;
    } else {
        try {
            supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("✅ Supabase client initialized successfully");
            console.log(`📦 Using bucket: ${PRODUCT_IMAGES_BUCKET}`);
            supabaseConfigured = true;
        } catch (error) {
            console.error("❌ Failed to initialize Supabase client:", error.message);
            console.log("💡 Please check your Supabase credentials in .env file");
            supabase = null;
            supabaseConfigured = false;
        }
    }
}

// Helper function to check if Supabase is available
const isSupabaseConfigured = () => supabaseConfigured && supabase !== null;

// Helper function to get appropriate error message
const getSupabaseErrorMessage = () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return "Photo upload service is not configured. Please contact administrator.";
    }
    if (SUPABASE_URL.includes('your-project-id') || SUPABASE_ANON_KEY.includes('your-anon-key')) {
        return "Photo upload service is not properly configured. Please contact administrator.";
    }
    return "Photo upload service is temporarily unavailable. Please try again later.";
};

module.exports = {
    supabase,
    PRODUCT_IMAGES_BUCKET,
    isSupabaseConfigured,
    getSupabaseErrorMessage
};


