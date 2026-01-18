import { createClient } from '@supabase/supabase-js';

// Default keys (fallbacks)
// Default keys (fallbacks)
const DEFAULT_URL = 'https://bysvhhtgutdzzjoymjrf.supabase.co';
const DEFAULT_KEY = 'sb_publishable_a5SjPIzZl_u_7mWI-wvh_g_rbYv85EH';

// Get from env (Vite/Vercel), localStorage or use default
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url') || DEFAULT_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_key') || DEFAULT_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
