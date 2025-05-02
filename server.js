import express from 'express';
import { supabase } from './db.config.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';

// Carica variabili d'ambiente
dotenv.config();

// Ottieni il percorso corrente (una sola volta)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug: mostra info sul percorso
console.log('[Setup] Directory corrente:', __dirname);
console.log('[Setup] Percorso cartella public:', path.join(__dirname, 'public'));

const app = express();
const PORT = process.env.PORT || 3000;

// Configura CORS in modo più specifico
app.use(cors({
  origin: '*', // In produzione, limita alle origini consentite
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  credentials: true
}));

// Abilita il middleware per il parsing del JSON
app.use(express.json());

// Configura il middleware per servire i file statici
app.use(express.static(path.join(__dirname, 'public')));

// Route per la homepage
app.get('/', (req, res) => {
  console.log('[Render Debug] Richiesta homepage');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/submit-score', async (req, res) => {
  console.log('[Render Debug] Ricevuta richiesta POST a /submit-score');
  console.log('[Render Debug] Corpo della richiesta:', req.body);
  console.log('[Render Debug] Tipo di userId:', typeof req.body.userId);
  console.log('[Render Debug] Tipo di punteggio:', typeof req.body.punteggio);
  console.log('[Render Debug] Supabase URL configurato:', process.env.SUPABASE_URL ? 'Sì' : 'No');
  
  const { userId, punteggio } = req.body;
  
  // Log per debug approfondito
  console.log('[Render Debug] userId è undefined?', userId === undefined);
  console.log('[Render Debug] userId è null?', userId === null);
  console.log('[Render Debug] userId è valido?', userId !== undefined && userId !== null);
  console.log('[Render Debug] punteggio isNaN?', isNaN(punteggio));
  console.log('[Render Debug] punteggio range?', punteggio >= 0 && punteggio <= 100);
  
  // Condizione molto permissiva per test
  if (userId === undefined || userId === null || isNaN(punteggio) || punteggio < 0 || punteggio > 100) {
    console.log('[Render Debug] Dati non validi:', { userId, punteggio });
    return res.status(400).json({ error: 'Dati non validi' });
  }

  try {
    console.log('[Render Debug] Verifica punteggio esistente per userId:', userId);
    const { data: existingScore, error: checkError } = await supabase
      .from('Punteggi')
      .select()
      .eq('userId', userId);
    
    if (checkError) {
      console.error('[Render Debug] Errore nella verifica del punteggio esistente:', checkError);
      return res.status(500).json({ error: 'Errore nella verifica del punteggio esistente' });
    }
    
    console.log('[Render Debug] Punteggio esistente:', existingScore);
    
    let result;
    
    if (existingScore && existingScore.length > 0) {
      console.log('[Render Debug] Aggiornamento punteggio per userId:', userId);
      result = await supabase
        .from('Punteggi')
        .update({ score: punteggio })
        .eq('userId', userId);
    } else {
      console.log('[Render Debug] Inserimento nuovo punteggio per userId:', userId);
      result = await supabase
        .from('Punteggi')
        .insert([{ userId: userId, score: punteggio }]);
    }
    
    if (result.error) {
      console.error('[Render Debug] Errore operazione Supabase:', result.error);
      return res.status(500).json({ error: `Errore nel salvataggio del punteggio: ${result.error.message}` });
    }
    
    console.log('[Render Debug] Operazione completata con successo');
    res.json({ success: true });
  } catch (error) {
    console.error('[Render Debug] Errore catturato:', error);
    res.status(500).json({ error: `Errore nel server: ${error.message}` });
  }
});

// Rotta per ottenere tutti i punteggi
app.get('/get-scores', async (req, res) => {
  console.log('[Render Debug] Ricevuta richiesta GET a /get-scores');
  try {
    const { data, error } = await supabase
      .from('Punteggi')
      .select('*')
      .order('score', { ascending: false });
    
    if (error) {
      console.error('[Render Debug] Errore nel recupero dei punteggi:', error);
      throw error;
    }
    
    console.log('[Render Debug] Punteggi recuperati:', data);
    res.json(data || []);
  } catch (error) {
    console.error('[Render Debug] Errore:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rotta per eliminare un punteggio
app.delete('/delete-score', async (req, res) => {
  console.log('[Render Debug] Ricevuta richiesta DELETE a /delete-score');
  console.log('[Render Debug] Corpo della richiesta:', req.body);
  
  const { userId } = req.body;
  
  if (userId === undefined || userId === null || userId === '') {
    console.log('[Render Debug] UserId mancante nella richiesta di eliminazione');
    return res.status(400).json({ error: 'UserId richiesto' });
  }
  
  try {
    // Converti sempre l'userId in stringa per assicurare consistenza
    const userIdString = String(userId);
    console.log('[Render Debug] Tentativo di eliminare punteggio per userId (convertito):', userIdString);
    
    const { error } = await supabase
      .from('Punteggi')
      .delete()
      .eq('userId', userIdString);
    
    if (error) {
      console.error('[Render Debug] Errore nell\'eliminazione del punteggio:', error);
      return res.status(500).json({ error: `Errore nell'eliminazione del punteggio: ${error.message}` });
    }
    
    console.log('[Render Debug] Punteggio eliminato con successo per userId:', userIdString);
    res.json({ success: true });
  } catch (error) {
    console.error('[Render Debug] Errore server durante l\'eliminazione:', error);
    res.status(500).json({ error: `Errore nel server durante l'eliminazione: ${error.message}` });
  }
});

// Rotta di test per verificare la connessione a Supabase
app.get('/test-supabase', async (req, res) => {
  try {
    console.log('[Render Debug] Test connessione Supabase');
    console.log('[Render Debug] Supabase URL:', process.env.SUPABASE_URL);
    console.log('[Render Debug] Supabase Key configurata:', process.env.SUPABASE_ANON_KEY ? 'Sì' : 'No');
    
    const { data, error } = await supabase
      .from('Punteggi')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('[Render Debug] Errore test Supabase:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log('[Render Debug] Test Supabase riuscito, dati:', data);
    res.json({ 
      success: true, 
      message: 'Connessione a Supabase funzionante', 
      data 
    });
  } catch (error) {
    console.error('[Render Debug] Errore catturato nel test Supabase:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint di stato semplice
app.get('/status', (req, res) => {
  res.json({ 
    status: 'online',
    time: new Date().toISOString(),
    env: {
      node_env: process.env.NODE_ENV || 'not set',
      supabase_configured: process.env.SUPABASE_URL ? true : false
    }
  });
});

// Aggiungi questa route per verificare i file nella cartella public
app.get('/check-public', (req, res) => {
  const publicPath = path.join(__dirname, 'public');
  let result = {
    publicPath: publicPath,
    exists: false,
    isDirectory: false,
    files: []
  };
  
  try {
    const stat = fs.statSync(publicPath);
    result.exists = true;
    result.isDirectory = stat.isDirectory();
    
    if (result.isDirectory) {
      result.files = fs.readdirSync(publicPath);
    }
  } catch (e) {
    result.error = e.message;
  }
  
  res.json(result);
});

// Aggiungi questa route per visualizzare il contenuto del file index.html
app.get('/view-index', (req, res) => {
  try {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    const content = fs.readFileSync(indexPath, 'utf8');
    res.send(`<pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`);
  } catch (error) {
    res.status(500).send(`Errore nella lettura del file: ${error.message}`);
  }
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`[Render Debug] Server in esecuzione sulla porta ${PORT}`);
  console.log(`[Render Debug] NODE_ENV: ${process.env.NODE_ENV || 'non impostato'}`);
  console.log(`[Render Debug] Variabili SUPABASE configurate: ${process.env.SUPABASE_URL ? 'Sì' : 'No'}`);
});
