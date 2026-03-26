import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );

  private bucket = process.env.SUPABASE_BUCKET || 'documents';

  async uploadFile(filePath: string, buffer: Buffer, contentType: string) {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filePath, buffer, { contentType, upsert: true });

    if (error) throw new Error(`Upload failed: ${error.message}`);
    return filePath;
  }

  async getSignedUrl(filePath: string, expiresIn = 3600) {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) throw new Error(`Signed URL failed: ${error.message}`);
    return data.signedUrl;
  }
}
