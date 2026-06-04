import { getSupabaseAdmin } from './supabase.mjs';

export async function getPublicPortfolioAlbums() {
  const supabase = getSupabaseAdmin();

  const { data: items, error: itemError } = await supabase
    .from('portfolio_items')
    .select('*')
    .order('display_order', { ascending: true });

  if (itemError) throw new Error(itemError.message);

  const providerIds = [...new Set((items || []).map((i) => i.provider_id))];
  if (providerIds.length === 0) {
    return { albums: [], total: 0 };
  }

  const { data: profiles, error: profileError } = await supabase
    .from('provider_profiles')
    .select(
      'id, user_id, business_name, service_type, average_rating, is_verified, coverage_areas, bio, availability_status'
    )
    .in('id', providerIds);

  if (profileError) throw new Error(profileError.message);

  const { data: packages, error: packageError } = await supabase
    .from('service_packages')
    .select('id, provider_id, name, price, service_type')
    .eq('is_active', true);

  if (packageError) throw new Error(packageError.message);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  const packageCountByProvider = new Map();
  for (const pkg of packages || []) {
    packageCountByProvider.set(
      pkg.provider_id,
      (packageCountByProvider.get(pkg.provider_id) || 0) + 1
    );
  }

  const itemsByProvider = new Map();
  for (const item of items || []) {
    const list = itemsByProvider.get(item.provider_id) || [];
    list.push(item);
    itemsByProvider.set(item.provider_id, list);
  }

  const albums = Array.from(itemsByProvider.entries())
    .map(([providerId, providerItems]) => {
      const provider = profileMap.get(providerId);
      if (!provider) return null;

      const featured = providerItems.find((i) => i.is_featured);
      const cover = featured || providerItems[0];
      const categories = [
        ...new Set(providerItems.map((i) => i.category).filter(Boolean)),
      ];

      return {
        provider_id: providerId,
        provider,
        cover_image_url: cover?.image_url || null,
        cover_title: cover?.title || null,
        item_count: providerItems.length,
        package_count: packageCountByProvider.get(providerId) || 0,
        featured_count: providerItems.filter((i) => i.is_featured).length,
        categories,
        preview_items: providerItems.slice(0, 4),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.item_count - a.item_count);

  return { albums, total: albums.length };
}
