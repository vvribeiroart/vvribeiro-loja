// ==========================================
// SUPABASE CLIENT CONFIGURATION
// ==========================================

// ⚠️ ATENÇÃO VICTOR: REPLACE THESE PLACEHOLDERS WITH YOUR REAL SUPABASE CREDENTIALS!
// Get these from your Supabase Dashboard -> Project Settings -> API
const SUPABASE_URL = 'DEIXE_O_SUPABASE_URL_AQUI';
const SUPABASE_ANON_KEY = 'DEIXE_A_CHAVE_ANON_AQUI';

// Initialize the Supabase Client
// This object is attached to the global 'window' so it can be used across all scripts
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
