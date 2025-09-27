// Supabase client configuration - to be implemented when environment variables are set
// export const supabase = {} as any;

interface StorageBucket {
  from: (bucket: string) => {
    upload: (path: string, file: File) => Promise<{ data: { path: string } | null; error: Error | null }>;
    remove: (paths: string[]) => Promise<{ error: Error | null }>;
    getPublicUrl: (path: string) => { data: { publicUrl: string } };
  };
}

interface SupabaseClient {
  storage: StorageBucket;
}

export const supabase: SupabaseClient = {
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      remove: () => Promise.resolve({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  }
};

// Mock Supabase types for development
export interface User {
  id: string;
  email: string;
}

export interface Session {
  access_token: string;
  user: User;
}