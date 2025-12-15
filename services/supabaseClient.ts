import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace these with your actual Supabase project URL and Anon Key
// You can find these in your Supabase Dashboard -> Project Settings -> API
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mcftrhvgnzjgikcfjjtg.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZnRyaHZnbnpqZ2lrY2ZqanRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzQ2MTksImV4cCI6MjA4MTM1MDYxOX0.n7LP22M0MYPa0qwt0BTJyt30pqJKAY7JrIqE1HMKbIQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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