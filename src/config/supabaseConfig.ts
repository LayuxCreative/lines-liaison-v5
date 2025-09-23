export const SUPABASE_CONFIG = {
  project: {
    id: 'ymstntjoewkyissepjbc',
    url: 'https://ymstntjoewkyissepjbc.supabase.co'
  },
  api: {
    anon: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    serviceRole: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
  },
  storage: {
    bucket: 'lines-liaison-storage',
    publicUrl: 'https://ymstntjoewkyissepjbc.supabase.co/storage/v1/object/public'
  },
  database: {
    region: 'us-east-1',
    status: 'active'
  },
  connection: {
    realtimeEnabled: true,
    autoRefreshToken: true,
    persistSession: true
  }
};

export const getSupabaseUrl = () => SUPABASE_CONFIG.project.url;
export const getSupabaseAnonKey = () => SUPABASE_CONFIG.api.anon;
export const getSupabaseServiceKey = () => SUPABASE_CONFIG.api.serviceRole;
export const getStorageBucket = () => SUPABASE_CONFIG.storage.bucket;
export const getStoragePublicUrl = () => SUPABASE_CONFIG.storage.publicUrl;

export type SupabaseConfig = typeof SUPABASE_CONFIG;