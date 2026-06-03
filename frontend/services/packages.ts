import { apiRequest } from '@/lib/api';
import type { ProviderProfile } from './provider';

type DbInsert<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
type DbUpdate<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;

export type ServiceType = 'photography' | 'editing' | 'both';

export interface ServicePackage {
  id: string;
  provider_id: string;
  name: string;
  description: string;
  service_type: ServiceType;
  duration_hours?: number | null;
  price: number;
  deliverables: string[];
  max_revisions: number;
  turnaround_days?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PackageWithProvider extends ServicePackage {
  provider: ProviderProfile;
}

export class PackageServiceError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'PackageServiceError';
  }
}

export const getServicePackages = async (providerId: string): Promise<ServicePackage[]> =>
  apiRequest<ServicePackage[]>(`/packages/provider/${providerId}`);

export const getExplorePackages = async (): Promise<PackageWithProvider[]> =>
  apiRequest<PackageWithProvider[]>('/packages/search');

export const getActiveServicePackages = async (providerId: string): Promise<ServicePackage[]> => {
  const data = await getServicePackages(providerId);
  return data.filter((item) => item.is_active);
};

export const getServicePackageById = async (packageId: string): Promise<PackageWithProvider | null> => {
  try {
    return await apiRequest<PackageWithProvider>(`/packages/${packageId}`);
  } catch {
    return null;
  }
};

export const createServicePackage = async (packageData: DbInsert<ServicePackage>): Promise<ServicePackage | null> =>
  apiRequest<ServicePackage>('/packages', { method: 'POST', body: JSON.stringify(packageData) }, true);

export const updateServicePackage = async (
  packageId: string,
  updates: DbUpdate<ServicePackage>
): Promise<ServicePackage | null> =>
  apiRequest<ServicePackage>(`/packages/${packageId}`, { method: 'PUT', body: JSON.stringify(updates) }, true);

export const deleteServicePackage = async (packageId: string): Promise<boolean> => {
  await apiRequest<boolean>(`/packages/${packageId}`, { method: 'DELETE' }, true);
  return true;
};

export const togglePackageActive = async (packageId: string, isActive: boolean): Promise<ServicePackage | null> =>
  updateServicePackage(packageId, { is_active: isActive });

export const getPackagesByServiceType = async (providerId: string, serviceType: ServiceType): Promise<ServicePackage[]> => {
  const data = await getServicePackages(providerId);
  return data.filter((item) => item.service_type === serviceType && item.is_active);
};

export const getPackagesInPriceRange = async (
  providerId: string,
  minPrice: number,
  maxPrice: number
): Promise<ServicePackage[]> => {
  const data = await getServicePackages(providerId);
  return data.filter((item) => item.price >= minPrice && item.price <= maxPrice && item.is_active);
};

export const countServicePackages = async (providerId: string): Promise<number> => (await getServicePackages(providerId)).length;

export const getServiceCategories = async () => [];
export const getCategoryBySlug = async (_slug: string) => null;

export const bulkUpdatePackageStatus = async (packageIds: string[], isActive: boolean): Promise<number> => {
  await Promise.all(packageIds.map((id) => updateServicePackage(id, { is_active: isActive })));
  return packageIds.length;
};

export const bulkDeletePackages = async (packageIds: string[]): Promise<number> => {
  await Promise.all(packageIds.map((id) => deleteServicePackage(id)));
  return packageIds.length;
};
