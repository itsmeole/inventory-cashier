import sharp from 'sharp';

/**
 * Kompresi dan resize gambar sebelum upload ke Supabase Storage.
 *
 * Strategi:
 * - Convert ke WebP (format modern, lebih kecil dari JPEG/PNG ~30%)
 * - Resize max 800px lebar (cukup untuk tampilan produk)
 * - Quality 80% — titik optimal antara kualitas visual dan ukuran file
 * - Hapus metadata EXIF (mengurangi ukuran + privasi)
 *
 * Contoh hasil:
 *   Foto kamera 4MB  → ~80-150KB WebP
 *   Screenshot 500KB → ~40-80KB WebP
 */
export async function compressImage(buffer: Buffer): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
    const compressed = await sharp(buffer)
        .resize({
            width: 800,
            height: 800,
            fit: 'inside',          // tidak crop, hanya memperkecil jika melebihi batas
            withoutEnlargement: true // tidak perbesar jika gambar sudah kecil
        })
        .webp({ quality: 80 })      // convert ke WebP, quality 80%
        .withMetadata(false)        // hapus metadata EXIF
        .toBuffer();

    return {
        buffer: compressed,
        contentType: 'image/webp',
        ext: 'webp'
    };
}

/**
 * Generate nama file yang bersih dan unik untuk Storage.
 * Format: {store_id}/{timestamp}-{nama_aman}.webp
 */
export function generateStorageFilename(storeId: string, originalName: string): string {
    const safeName = originalName
        .replace(/\.[^/.]+$/, '')   // hapus ekstensi asli
        .replace(/[^a-zA-Z0-9]/g, '_') // ganti karakter non-alphanumeric
        .toLowerCase()
        .slice(0, 40);               // batasi panjang nama
    return `${storeId}/${Date.now()}-${safeName}.webp`;
}

/**
 * Ekstrak storage path dari public URL Supabase.
 * Contoh: https://xxx.supabase.co/storage/v1/object/public/product-images/store/file.webp
 * → store/file.webp
 */
export function extractStoragePath(publicUrl: string, bucketName: string): string | null {
    try {
        const marker = `/object/public/${bucketName}/`;
        const idx = publicUrl.indexOf(marker);
        if (idx === -1) return null;
        return publicUrl.substring(idx + marker.length);
    } catch {
        return null;
    }
}
