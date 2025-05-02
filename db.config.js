import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente solo in ambiente di sviluppo
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Usa le variabili d'ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Verifica se le variabili sono definite
if (!supabaseUrl || !supabaseKey) {
  console.error('Errore: SUPABASE_URL e SUPABASE_ANON_KEY devono essere definiti nelle variabili d\'ambiente.');
  console.error('Verifica che le variabili d\'ambiente siano configurate correttamente.');
}

// Crea e esporta il client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);
