"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
let StorageService = class StorageService {
    supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    bucket = process.env.SUPABASE_BUCKET || 'documents';
    async uploadFile(filePath, buffer, contentType) {
        const { error } = await this.supabase.storage
            .from(this.bucket)
            .upload(filePath, buffer, { contentType, upsert: true });
        if (error)
            throw new Error(`Upload failed: ${error.message}`);
        return filePath;
    }
    async getSignedUrl(filePath, expiresIn = 3600) {
        const { data, error } = await this.supabase.storage
            .from(this.bucket)
            .createSignedUrl(filePath, expiresIn);
        if (error)
            throw new Error(`Signed URL failed: ${error.message}`);
        return data.signedUrl;
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)()
], StorageService);
//# sourceMappingURL=storage.service.js.map