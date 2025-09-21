/**
 * Supabase Storage Schema Documentation
 * This file contains the correct column names for Supabase storage tables
 * to prevent SQL query errors.
 */

// Storage Objects Table Columns
export const STORAGE_OBJECTS_COLUMNS = {
  id: 'uuid',
  bucket_id: 'text',
  name: 'text',
  owner: 'uuid',
  created_at: 'timestamp with time zone',
  updated_at: 'timestamp with time zone',
  last_accessed_at: 'timestamp with time zone',
  metadata: 'jsonb',
  path_tokens: 'ARRAY',
  version: 'text',
  owner_id: 'text',
  user_metadata: 'jsonb',
  level: 'integer'
} as const;

// Storage Buckets Table Columns
export const STORAGE_BUCKETS_COLUMNS = {
  id: 'text',
  name: 'text',
  owner: 'uuid',
  created_at: 'timestamp with time zone',
  updated_at: 'timestamp with time zone',
  public: 'boolean',
  avif_autodetection: 'boolean',
  file_size_limit: 'bigint',
  allowed_mime_types: 'ARRAY',
  owner_id: 'text'
} as const;

// Helper functions for safe SQL queries
export const getStorageObjectsQuery = (bucketId: string, limit: number = 5) => {
  return `
    SELECT 
      id,
      bucket_id,
      name,
      owner,
      created_at,
      updated_at,
      metadata,
      owner_id
    FROM storage.objects 
    WHERE bucket_id = '${bucketId}' 
    ORDER BY created_at DESC 
    LIMIT ${limit};
  `;
};

export const getStorageBucketsQuery = () => {
  return `
    SELECT 
      id,
      name,
      public,
      created_at,
      updated_at
    FROM storage.buckets 
    ORDER BY created_at DESC;
  `;
};

// Common SQL query templates
export const STORAGE_QUERIES = {
  LIST_OBJECTS: (bucketId: string) => getStorageObjectsQuery(bucketId),
  LIST_BUCKETS: () => getStorageBucketsQuery(),
  CHECK_BUCKET_EXISTS: (bucketId: string) => `
    SELECT EXISTS(
      SELECT 1 FROM storage.buckets WHERE id = '${bucketId}'
    ) as bucket_exists;
  `,
  GET_OBJECT_METADATA: (bucketId: string, objectName: string) => `
    SELECT 
      name,
      metadata,
      created_at,
      updated_at
    FROM storage.objects 
    WHERE bucket_id = '${bucketId}' AND name = '${objectName}';
  `
} as const;