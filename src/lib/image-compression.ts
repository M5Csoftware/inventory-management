/**
 * Client-Side Image Compression Utility
 * Compresses raw camera photos & scanned document images (5MB–15MB)
 * down to ~100KB–300KB before uploading/saving to preserve bandwidth
 * on host services like Render.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0 (default 0.75)
  format?: 'image/jpeg' | 'image/webp';
}

export interface CompressedImageResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  fileName: string;
  fileSizeStr: string;
  compressionRatio: string;
}

/**
 * Format bytes into human-readable string (KB or MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Compresses an image File using HTML5 Canvas.
 * Non-image files (e.g., PDF) are returned as uncompressed Data URLs.
 */
export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.75,
    format = 'image/jpeg',
  } = options;

  const originalSize = file.size;

  // Non-image files (like PDFs) cannot be compressed with Canvas -> return as Data URL
  if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|webp|gif|bmp|heic)$/i)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        resolve({
          dataUrl,
          originalSize,
          compressedSize: originalSize,
          fileName: file.name,
          fileSizeStr: formatBytes(originalSize),
          compressionRatio: '0%',
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-ratio-preserved bounding box
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas context fails
          const fallbackUrl = e.target?.result as string;
          resolve({
            dataUrl: fallbackUrl,
            originalSize,
            compressedSize: originalSize,
            fileName: file.name,
            fileSizeStr: formatBytes(originalSize),
            compressionRatio: '0%',
          });
          return;
        }

        // Fill background with white (prevents transparent PNGs turning black on JPEG export)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Smooth high-quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export compressed Data URL
        const compressedDataUrl = canvas.toDataURL(format, quality);

        // Estimate byte size of Base64 string
        const base64Length = compressedDataUrl.split(',')[1]?.length || 0;
        const compressedSize = Math.round((base64Length * 3) / 4);

        const ratioNum = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

        resolve({
          dataUrl: compressedDataUrl,
          originalSize,
          compressedSize,
          fileName: file.name.replace(/\.[^/.]+$/, format === 'image/webp' ? '.webp' : '.jpg'),
          fileSizeStr: formatBytes(compressedSize),
          compressionRatio: `${ratioNum}%`,
        });
      };

      img.onerror = () => {
        // Fallback on image load error
        const fallbackUrl = e.target?.result as string;
        resolve({
          dataUrl: fallbackUrl,
          originalSize,
          compressedSize: originalSize,
          fileName: file.name,
          fileSizeStr: formatBytes(originalSize),
          compressionRatio: '0%',
        });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve({
        dataUrl: '',
        originalSize,
        compressedSize: 0,
        fileName: file.name,
        fileSizeStr: '0 KB',
        compressionRatio: '0%',
      });
    };

    reader.readAsDataURL(file);
  });
}
