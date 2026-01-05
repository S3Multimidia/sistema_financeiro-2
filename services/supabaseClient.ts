import { createClient } from '@supabase/supabase-js';

// TODO: Move these to .env file for security
const supabaseUrl = 'https://ujhdduyljjdkdblhtqic.supabase.co';
const supabaseKey = 'sb_publishable_H3WXUMpY4aHZiAXaxOf1dA_XQZl4-Qu';

export const supabase = createClient(supabaseUrl, supabaseKey);
