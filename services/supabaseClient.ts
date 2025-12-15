import { createClient } from '@supabase/supabase-js';

// Get Environment Variables
// In Vite/Vercel, these are injected at build time based on your Dashboard settings
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_KEY;

// Fallback logic:
// If keys are missing (e.g., user hasn't set them in Vercel yet),
// we use a dummy URL to allow createClient to initialize without crashing the app.
// The actual API calls will fail later, catching the error in App.tsx and switching to "Offline Mode".
const url = SUPABASE_URL && SUPABASE_URL !== '' ? SUPABASE_URL : 'https://your-project.supabase.co';
const key = SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== '' ? SUPABASE_ANON_KEY : 'placeholder-key';

export const supabase = createClient(url, key);

// Helper interface for database rows
export interface DbTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string;
  assignee_id: string | null;
}