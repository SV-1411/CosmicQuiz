import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://elcokdohddaagkpyakhv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY29rZG9oZGRhYWdrcHlha2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3ODY5NTUsImV4cCI6MjA3MzM2Mjk1NX0.XN5YRlW8H7RpMmU3cxfhdrn9uvUWUFDYUITFo-AyQgM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
