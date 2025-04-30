import { createClient } from '@supabase/supabase-js';

// Usa le variabili d'ambiente di Render
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);