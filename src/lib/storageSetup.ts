import { supabase } from './supabase';

export async function ensureStorageBucket() {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    const bucketExists = buckets?.some(bucket => bucket.id === 'event-files');

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket('event-files', {
        public: true,
        fileSizeLimit: 52428800,
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }

      console.log('Storage bucket "event-files" created successfully');
    }

    return true;
  } catch (error) {
    console.error('Error ensuring storage bucket:', error);
    return false;
  }
}
