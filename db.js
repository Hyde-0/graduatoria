import { createClient } from '@supabase/supabase-js';
 const SUPABASE_URL = 'https://iitmpihfptknwaydgzjz.supabase.co';
 const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpdG1waWhmcHRrbndheWRnemp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMDAzNjAsImV4cCI6MjA2MTU3NjM2MH0.CYcFNrcilUbWF5f12zGj8UyFdQGctgqLeYzDYsJBohg';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);



