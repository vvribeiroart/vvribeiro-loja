// ==========================================
// SUPABASE CLIENT CONFIGURATION
// ==========================================

// ⚠️ ATENÇÃO VICTOR: REPLACE THESE PLACEHOLDERS WITH YOUR REAL SUPABASE CREDENTIALS!
// Get these from your Supabase Dashboard -> Project Settings -> API
const SUPABASE_URL = 'https://iyiclarnackbgykxxoga.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_MrFyP5uykngFtSzloud2nA_n9Dx_afh';

// Initialize the Supabase Client
// This object is attached to the global 'window' so it can be used across all scripts
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
