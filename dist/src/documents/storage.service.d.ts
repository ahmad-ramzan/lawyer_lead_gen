export declare class StorageService {
    private supabase;
    private bucket;
    uploadFile(filePath: string, buffer: Buffer, contentType: string): Promise<string>;
    getSignedUrl(filePath: string, expiresIn?: number): Promise<string>;
}
