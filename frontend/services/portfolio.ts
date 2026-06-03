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

export const getPortfolioItems = async (providerId: string): Promise<PortfolioItem[]> =>
  apiRequest<PortfolioItem[]>(`/portfolio/provider/${providerId}`);

export const getFeaturedPortfolioItems = async (providerId: string): Promise<PortfolioItem[]> => {
  const data = await getPortfolioItems(providerId);
  return data.filter((item) => item.is_featured).slice(0, 6);
};

export const getPortfolioItemById = async (itemId: string): Promise<PortfolioItem | null> => {
  throw new Error('Get portfolio by id endpoint not implemented yet');
};

export const createPortfolioItem = async (
  portfolioItem: Omit<DbInsert<PortfolioItem>, 'id' | 'created_at'>
): Promise<PortfolioItem | null> =>
  apiRequest<PortfolioItem>('/portfolio', { method: 'POST', body: JSON.stringify(portfolioItem) }, true);

export const updatePortfolioItem = async (
  itemId: string,
  updates: DbUpdate<PortfolioItem>
): Promise<PortfolioItem | null> =>
  apiRequest<PortfolioItem>(`/portfolio/${itemId}`, { method: 'PUT', body: JSON.stringify(updates) }, true);

export const deletePortfolioItem = async (itemId: string): Promise<boolean> => {
  await apiRequest<boolean>(`/portfolio/${itemId}`, { method: 'DELETE' }, true);
  return true;
};

export const uploadPortfolioImage = async (providerId: string, file: File): Promise<string | null> => {
  const arrayBuffer = await file.arrayBuffer();
  const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

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

  return response.publicUrl;
};

export const toggleFeatured = async (itemId: string, isFeatured: boolean): Promise<PortfolioItem | null> =>
  updatePortfolioItem(itemId, { is_featured: isFeatured });

export const reorderPortfolioItems = async (items: { id: string; display_order: number }[]): Promise<boolean> => {
  await Promise.all(items.map((item) => updatePortfolioItem(item.id, { display_order: item.display_order })));
  return true;
};

export const getPortfolioByCategory = async (providerId: string, category: string): Promise<PortfolioItem[]> => {
  const data = await getPortfolioItems(providerId);
  return data.filter((item) => item.category === category);
};

export const countPortfolioItems = async (providerId: string): Promise<number> => (await getPortfolioItems(providerId)).length;
