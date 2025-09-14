import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://elcokdohddaagkpyakhv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY29rZG9oZGRhYWdrcHlha2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3ODY5NTUsImV4cCI6MjA3MzM2Mjk1NX0.XN5YRlW8H7RpMmU3cxfhdrn9uvUWUFDYUITFo-AyQgM'

// Optimized client configuration for high traffic
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-client-info': 'cosmicquiz@1.0.0'
    }
  }
})
