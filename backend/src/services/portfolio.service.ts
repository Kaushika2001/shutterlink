import { supabaseAdmin } from '../config/supabase';
import config, { isCloudinaryConfigured } from '../config/env';
import { uploadToCloudinary } from '../config/cloudinary';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export class PortfolioService {
  async assertProviderOwnership(userId: string, providerId: string): Promise<void> {
    const { data, error } = await supabaseAdmin
      .from('provider_profiles')
      .select('id')
      .eq('id', providerId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      throw new AuthorizationError('You can only manage your own portfolio');
    }
  }

  async assertPortfolioItemOwnership(userId: string, itemId: string): Promise<{ provider_id: string }> {
    const { data: item, error } = await supabaseAdmin
      .from('portfolio_items')
      .select('provider_id')
      .eq('id', itemId)
      .maybeSingle();

    if (error || !item) {
      throw new NotFoundError('Portfolio item not found');
    }

    await this.assertProviderOwnership(userId, item.provider_id);
    return item;
  }

  async getProviderPortfolio(providerId: string) {
    const { data, error } = await supabaseAdmin
      .from('portfolio_items')
      .select('*')
      .eq('provider_id', providerId)
      .order('display_order', { ascending: true });

    if (error) throw new ValidationError('Failed to fetch portfolio');
    return data || [];
  }

  async createPortfolioItem(
    userId: string,
    data: {
      provider_id: string;
      image_url: string;
      title?: string;
      description?: string;
      category?: string;
      is_featured?: boolean;
      display_order?: number;
    }
  ) {
    await this.assertProviderOwnership(userId, data.provider_id);

    const { data: item, error } = await supabaseAdmin
      .from('portfolio_items')
      .insert({
        provider_id: data.provider_id,
        image_url: data.image_url,
        title: data.title || 'Untitled',
        description: data.description || '',
        category: data.category || null,
        is_featured: data.is_featured ?? false,
        display_order: data.display_order ?? 0,
      })
      .select()
      .single();

    if (error || !item) throw new ValidationError(error?.message || 'Failed to create portfolio item');
    return item;
  }

  async updatePortfolioItem(userId: string, itemId: string, updates: Record<string, unknown>) {
    await this.assertPortfolioItemOwnership(userId, itemId);

    const allowed = ['title', 'description', 'image_url', 'category', 'is_featured', 'display_order'];
    const payload = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowed.includes(key))
    );

    const { data, error } = await supabaseAdmin
      .from('portfolio_items')
      .update(payload)
      .eq('id', itemId)
      .select()
      .single();

    if (error || !data) throw new NotFoundError('Portfolio item not found');
    return data;
  }

  async deletePortfolioItem(userId: string, itemId: string) {
    await this.assertPortfolioItemOwnership(userId, itemId);

    const { error } = await supabaseAdmin.from('portfolio_items').delete().eq('id', itemId);
    if (error) throw new ValidationError('Failed to delete portfolio item');
  }

  async uploadImageFile(
    userId: string,
    providerId: string,
    fileName: string,
    contentType: string | undefined,
    base64Data: string
  ): Promise<{ publicUrl: string; publicId: string }> {
    if (!providerId || !fileName || !base64Data) {
      throw new ValidationError('providerId, fileName, and base64Data are required');
    }

    await this.assertProviderOwnership(userId, providerId);

    const fileBuffer = Buffer.from(base64Data, 'base64');
    if (!fileBuffer.length) {
      throw new ValidationError('Invalid image data');
    }
    if (fileBuffer.length > MAX_UPLOAD_BYTES) {
      throw new ValidationError('Image must be less than 5MB');
    }

    const mime = contentType || 'image/jpeg';
    if (!mime.startsWith('image/')) {
      throw new ValidationError('Only image files are allowed');
    }

    const publicId = `${providerId}-${Date.now()}`;

    if (config.PORTFOLIO_STORAGE === 'cloudinary') {
      if (!isCloudinaryConfigured()) {
        throw new ValidationError(
          'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env'
        );
      }
      return uploadToCloudinary(fileBuffer, 'shutterlink/portfolio', publicId);
    }

    return this.uploadToSupabaseStorage(providerId, fileName, fileBuffer, mime);
  }

  private async uploadToSupabaseStorage(
    providerId: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<{ publicUrl: string; publicId: string }> {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${providerId}/${Date.now()}-${safeName}`;

    const { error } = await supabaseAdmin.storage
      .from(config.SUPABASE_BUCKET)
      .upload(path, fileBuffer, { contentType, upsert: true });

    if (error) {
      throw new ValidationError(
        `Image upload failed. Configure Cloudinary or create the "${config.SUPABASE_BUCKET}" storage bucket in Supabase.`
      );
    }

    const { data } = supabaseAdmin.storage.from(config.SUPABASE_BUCKET).getPublicUrl(path);
    return { publicUrl: data.publicUrl, publicId: path };
  }
}

export const portfolioService = new PortfolioService();
