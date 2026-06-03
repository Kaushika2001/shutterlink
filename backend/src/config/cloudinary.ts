import { v2 as cloudinary } from 'cloudinary';
import config, { isCloudinaryConfigured } from './env';

if (config.PORTFOLIO_STORAGE === 'cloudinary' && !isCloudinaryConfigured()) {
  console.warn('PORTFOLIO_STORAGE=cloudinary but Cloudinary credentials are missing in .env');
}

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = 'shutterlink/portfolio',
  publicId?: string
): Promise<{ publicUrl: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(new Error(error?.message || 'Cloudinary upload failed'));
          return;
        }
        resolve({ publicUrl: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
