import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Fix para error 1016 en Cloudflare Workers:
// Usar fetch global con configuración que evita el problema de resolución DNS
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        // @ts-expect-error - Cloudflare Workers specific option
        cf: { resolveOverride: undefined },
      });
    },
  },
});
