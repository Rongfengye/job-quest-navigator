
import { supabase } from '@/integrations/supabase/client';

export const uploadFile = async (file: File, path: string) => {
  if (!file) return null;
  
  const fileExt = file.name.split('.').pop();
  const filePath = `${path}/${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('job_documents')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Error uploading file: ${error.message}`);
  }

  return filePath;
};
