import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ifqczmtulkedxpjyxuth.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcWN6bXR1bGtlZHhwanl4dXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDEyMjEsImV4cCI6MjA4NjkxNzIyMX0.OJy4J-wch72IY_cjT5wq3Y-Xryji1ORwOeTgeOwr0C8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})


