import { apiRequest } from '@/lib/api';

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export const getPortfolioItems = async (providerId: string): Promise<PortfolioItem[]> =>
  apiRequest<PortfolioItem[]>(`/portfolio/provider/${providerId}`);

export const getFeaturedPortfolioItems = async (providerId: string): Promise<PortfolioItem[]> => {
  const data = await getPortfolioItems(providerId);
  return data.filter((item) => item.is_featured).slice(0, 6);
};

export const createPortfolioItem = async (
  portfolioItem: Omit<DbInsert<PortfolioItem>, 'id' | 'created_at'>
): Promise<PortfolioItem> =>
  apiRequest<PortfolioItem>(
    '/portfolio',
    { method: 'POST', body: JSON.stringify(portfolioItem) },
    true
  );

export const updatePortfolioItem = async (
  itemId: string,
  updates: DbUpdate<PortfolioItem>
): Promise<PortfolioItem> =>
  apiRequest<PortfolioItem>(`/portfolio/${itemId}`, { method: 'PUT', body: JSON.stringify(updates) }, true);

export const deletePortfolioItem = async (itemId: string): Promise<boolean> => {
  await apiRequest<null>(`/portfolio/${itemId}`, { method: 'DELETE' }, true);
  return true;
};

export const uploadPortfolioImage = async (providerId: string, file: File): Promise<string> => {
  const base64Data = await fileToBase64(file);

  const response = await apiRequest<{ publicUrl: string }>(
    '/portfolio/upload',
    {
      method: 'POST',
      body: JSON.stringify({
        providerId,
        fileName: file.name,
        contentType: file.type,
        base64Data,
      }),
    },
    true
  );

  if (!response.publicUrl) {
    throw new Error('Upload succeeded but no image URL was returned');
  }

  return response.publicUrl;
};

export const toggleFeatured = async (itemId: string, isFeatured: boolean): Promise<PortfolioItem> =>
  updatePortfolioItem(itemId, { is_featured: isFeatured });

export const reorderPortfolioItems = async (items: { id: string; display_order: number }[]): Promise<boolean> => {
  await Promise.all(items.map((item) => updatePortfolioItem(item.id, { display_order: item.display_order })));
  return true;
};

export const getPortfolioByCategory = async (providerId: string, category: string): Promise<PortfolioItem[]> => {
  const data = await getPortfolioItems(providerId);
  return data.filter((item) => item.category === category);
};

export const countPortfolioItems = async (providerId: string): Promise<number> =>
  (await getPortfolioItems(providerId)).length;

export interface PortfolioAlbumProvider {
  id: string;
  user_id: string;
  business_name?: string;
  service_type?: string[];
  average_rating?: number;
  is_verified?: boolean;
  coverage_areas?: string[];
  bio?: string;
  availability_status?: string;
}

export interface PortfolioAlbumPreviewItem {
  id: string;
  title: string;
  image_url: string;
  category?: string;
  is_featured: boolean;
}

export interface PortfolioAlbum {
  provider_id: string;
  provider: PortfolioAlbumProvider;
  cover_image_url: string | null;
  cover_title: string | null;
  item_count: number;
  package_count: number;
  featured_count: number;
  categories: string[];
  preview_items: PortfolioAlbumPreviewItem[];
}

export const getPublicPortfolioAlbums = async (): Promise<PortfolioAlbum[]> => {
  const data = await apiRequest<{ albums: PortfolioAlbum[]; total: number }>('/public/portfolio-albums');
  return data.albums || [];
};
