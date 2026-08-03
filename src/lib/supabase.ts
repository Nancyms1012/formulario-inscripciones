import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Cliente para usar desde el navegador (evita error 1016 en Cloudflare Workers)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
