// server.js

import 'dotenv/config'; // Deve essere la PRIMA riga
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './db.config.js'; // Importa dopo dotenv

// Mostra le variabili di ambiente caricate
console.log('SUPABASE_URL from env:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY from env:', process.env.SUPABASE_ANON_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/submit', async (req, res) => {
  const { nickname, score } = req.body;

  if (!nickname || typeof score !== 'number') {
    return res.status(400).json({ error: 'Nickname e punteggio sono obbligatori.' });
  }

  const { data: existingEntry, error: selectError } = await supabase
    .from('graduatoria')
    .select('*')
    .eq('nickname', nickname)
    .single();

  // Se l'errore non è "nessun record trovato", restituisci errore
  if (selectError && selectError.code !== 'PGRST116') {
    return res.status(500).json({ error: selectError.message });
  }

  if (existingEntry) {
    // aggiorna il punteggio
    const { error: updateError } = await supabase
      .from('graduatoria')
      .update({ score })
      .eq('nickname', nickname);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }
  } else {
    // crea nuovo record
    const { error: insertError } = await supabase
      .from('graduatoria')
      .insert([{ nickname, score }]);

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }
  }

  res.status(200).json({ message: 'Punteggio salvato!' });
});

app.get('/scores', async (req, res) => {
  const { data, error } = await supabase
    .from('graduatoria')
    .select('*')
    .order('score', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

const porta = process.env.PORT || process.env.porta || 3000;
app.listen(porta, () => {
  console.log(`Server in ascolto sulla porta ${porta}`);
});
