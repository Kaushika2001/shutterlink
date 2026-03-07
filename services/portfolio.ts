import { supabase } from '@/lib/supabaseClient';

// Type helpers
type DbInsert<T> = Omit<T, 'id' | 'created_at'>;
type DbUpdate<T> = Partial<Omit<T, 'id' | 'created_at'>>;

export interface PortfolioItem {
  id: string;
  provider_id: string;
  title: string;
  description?: string;
  image_url: string;
  category?: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

/* =========================
   GET PORTFOLIO ITEMS
========================= */
export const getPortfolioItems = async (providerId: string): Promise<PortfolioItem[]> => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('provider_id', providerId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching portfolio items:', error);
    return [];
  }

  return data || [];
};

/* =========================
   GET FEATURED PORTFOLIO ITEMS
========================= */
export const getFeaturedPortfolioItems = async (providerId: string): Promise<PortfolioItem[]> => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('provider_id', providerId)
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .limit(6);

  if (error) {
    console.error('Error fetching featured portfolio items:', error);
    return [];
  }

  return data || [];
};

/* =========================
   GET PORTFOLIO ITEM BY ID
========================= */
export const getPortfolioItemById = async (itemId: string): Promise<PortfolioItem | null> => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (error) {
    console.error('Error fetching portfolio item:', error);
    return null;
  }

  return data;
};

/* =========================
   CREATE PORTFOLIO ITEM
========================= */
export const createPortfolioItem = async (
  portfolioItem: Omit<DbInsert<PortfolioItem>, 'id' | 'created_at'>
): Promise<PortfolioItem | null> => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .insert(portfolioItem)
    .select()
    .single();

  if (error) {
    console.error('Error creating portfolio item:', error);
    throw new Error('Failed to create portfolio item');
  }

  return data;
};

/* =========================
   UPDATE PORTFOLIO ITEM
========================= */
export const updatePortfolioItem = async (
  itemId: string,
  updates: DbUpdate<PortfolioItem>
): Promise<PortfolioItem | null> => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating portfolio item:', error);
    throw new Error('Failed to update portfolio item');
  }

  return data;
};

/* =========================
   DELETE PORTFOLIO ITEM
========================= */
export const deletePortfolioItem = async (itemId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error deleting portfolio item:', error);
    return false;
  }

  return true;
};

/* =========================
   UPLOAD PORTFOLIO IMAGE
========================= */
export const uploadPortfolioImage = async (
  providerId: string,
  file: File
): Promise<string | null> => {
  try {
    // 1. Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${providerId}-${Date.now()}.${fileExt}`;
    const filePath = `portfolio-images/${fileName}`;

    console.log('Uploading file:', { fileName, filePath, fileSize: file.size, fileType: file.type });

    const { data, error: uploadError } = await supabase.storage
      .from('portfolio-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      
      // Provide specific error messages
      if (uploadError.message.includes('Bucket not found')) {
        throw new Error('Storage bucket not configured. Please contact support or check setup instructions.');
      } else if (uploadError.message.includes('policy')) {
        throw new Error('Permission denied. Make sure you have a provider profile set up.');
      } else if (uploadError.message.includes('size')) {
        throw new Error('File is too large. Maximum size is 5MB.');
      } else {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
    }

    console.log('Upload successful:', data);

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from('portfolio-images')
      .getPublicUrl(filePath);

    console.log('Public URL generated:', urlData.publicUrl);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading portfolio image:', error);
    
    // Re-throw with more context if it's already an Error
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to upload portfolio image: ' + (error?.message || 'Unknown error'));
  }
};

/* =========================
   TOGGLE FEATURED STATUS
========================= */
export const toggleFeatured = async (
  itemId: string,
  isFeatured: boolean
): Promise<PortfolioItem | null> => {
  return updatePortfolioItem(itemId, { is_featured: isFeatured });
};

/* =========================
   REORDER PORTFOLIO ITEMS
========================= */
export const reorderPortfolioItems = async (
  items: { id: string; display_order: number }[]
): Promise<boolean> => {
  try {
    // Update each item's display order
    const promises = items.map((item) =>
      supabase
        .from('portfolio_items')
        .update({ display_order: item.display_order })
        .eq('id', item.id)
    );

    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Error reordering portfolio items:', error);
    return false;
  }
};

/* =========================
   GET PORTFOLIO BY CATEGORY
========================= */
export const getPortfolioByCategory = async (
  providerId: string,
  category: string
): Promise<PortfolioItem[]> => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('provider_id', providerId)
    .eq('category', category)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching portfolio by category:', error);
    return [];
  }

  return data || [];
};

/* =========================
   COUNT PORTFOLIO ITEMS
========================= */
export const countPortfolioItems = async (providerId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('portfolio_items')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', providerId);

  if (error) {
    console.error('Error counting portfolio items:', error);
    return 0;
  }

  return count || 0;
};
