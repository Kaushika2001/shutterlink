import { supabase } from '@/lib/supabaseClient';

// Type helpers
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

// Custom error class for better error handling
export class PackageServiceError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'PackageServiceError';
  }
}

/* =========================
   GET SERVICE PACKAGES
========================= */
export const getServicePackages = async (providerId: string): Promise<ServicePackage[]> => {
  try {
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('provider_id', providerId)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching service packages:', error);
      throw new PackageServiceError('Failed to fetch service packages', error);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getServicePackages:', error);
    throw error instanceof PackageServiceError ? error : new PackageServiceError('An unexpected error occurred', error);
  }
};

/* =========================
   GET ACTIVE SERVICE PACKAGES
========================= */
export const getActiveServicePackages = async (providerId: string): Promise<ServicePackage[]> => {
  try {
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching active service packages:', error);
      throw new PackageServiceError('Failed to fetch active packages', error);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getActiveServicePackages:', error);
    throw error instanceof PackageServiceError ? error : new PackageServiceError('An unexpected error occurred', error);
  }
};

/* =========================
   GET SERVICE PACKAGE BY ID
========================= */
export const getServicePackageById = async (packageId: string): Promise<ServicePackage | null> => {
  try {
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (error) {
      console.error('Error fetching service package:', error);
      throw new PackageServiceError('Failed to fetch package details', error);
    }

    return data;
  } catch (error) {
    console.error('Error in getServicePackageById:', error);
    throw error instanceof PackageServiceError ? error : new PackageServiceError('An unexpected error occurred', error);
  }
};

/* =========================
   CREATE SERVICE PACKAGE
========================= */
export const createServicePackage = async (
  packageData: DbInsert<ServicePackage>
): Promise<ServicePackage | null> => {
  try {
    // Validate required fields
    if (!packageData.provider_id) {
      throw new PackageServiceError('Provider ID is required');
    }
    if (!packageData.name || packageData.name.trim().length < 3) {
      throw new PackageServiceError('Package name must be at least 3 characters');
    }
    if (!packageData.price || packageData.price < 0) {
      throw new PackageServiceError('Package price must be a positive number');
    }

    const { data, error } = await supabase
      .from('service_packages')
      .insert(packageData)
      .select()
      .single();

    if (error) {
      console.error('Error creating service package:', error);
      throw new PackageServiceError('Failed to create service package', error);
    }

    return data;
  } catch (error) {
    console.error('Error in createServicePackage:', error);
    throw error instanceof PackageServiceError ? error : new PackageServiceError('An unexpected error occurred', error);
  }
};

/* =========================
   UPDATE SERVICE PACKAGE
========================= */
export const updateServicePackage = async (
  packageId: string,
  updates: DbUpdate<ServicePackage>
): Promise<ServicePackage | null> => {
  try {
    if (!packageId) {
      throw new PackageServiceError('Package ID is required');
    }

    const { data, error } = await supabase
      .from('service_packages')
      .update(updates)
      .eq('id', packageId)
      .select()
      .single();

    if (error) {
      console.error('Error updating service package:', error);
      throw new PackageServiceError('Failed to update service package', error);
    }

    return data;
  } catch (error) {
    console.error('Error in updateServicePackage:', error);
    throw error instanceof PackageServiceError ? error : new PackageServiceError('An unexpected error occurred', error);
  }
};

/* =========================
   DELETE SERVICE PACKAGE
========================= */
export const deleteServicePackage = async (packageId: string): Promise<boolean> => {
  try {
    if (!packageId) {
      throw new PackageServiceError('Package ID is required');
    }

    const { error } = await supabase
      .from('service_packages')
      .delete()
      .eq('id', packageId);

    if (error) {
      console.error('Error deleting service package:', error);
      throw new PackageServiceError('Failed to delete service package', error);
    }

    return true;
  } catch (error) {
    console.error('Error in deleteServicePackage:', error);
    throw error instanceof PackageServiceError ? error : new PackageServiceError('An unexpected error occurred', error);
  }
};

/* =========================
   TOGGLE PACKAGE ACTIVE STATUS
========================= */
export const togglePackageActive = async (
  packageId: string,
  isActive: boolean
): Promise<ServicePackage | null> => {
  return updateServicePackage(packageId, { is_active: isActive });
};

/* =========================
   GET PACKAGES BY SERVICE TYPE
========================= */
export const getPackagesByServiceType = async (
  providerId: string,
  serviceType: ServiceType
): Promise<ServicePackage[]> => {
  try {
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('provider_id', providerId)
      .eq('service_type', serviceType)
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching packages by service type:', error);
      throw new PackageServiceError('Failed to fetch packages by service type', error);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPackagesByServiceType:', error);
    throw error instanceof PackageServiceError ? error : new PackageServiceError('An unexpected error occurred', error);
  }
};

/* =========================
   GET PACKAGES IN PRICE RANGE
========================= */
export const getPackagesInPriceRange = async (
  providerId: string,
  minPrice: number,
  maxPrice: number
): Promise<ServicePackage[]> => {
  try {
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .gte('price', minPrice)
      .lte('price', maxPrice)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching packages in price range:', error);
      throw new PackageServiceError('Failed to fetch packages in price range', error);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPackagesInPriceRange:', error);
    throw error instanceof PackageServiceError ? error : new PackageServiceError('An unexpected error occurred', error);
  }
};

/* =========================
   COUNT SERVICE PACKAGES
========================= */
export const countServicePackages = async (providerId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('service_packages')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', providerId);

    if (error) {
      console.error('Error counting service packages:', error);
      throw new PackageServiceError('Failed to count packages', error);
    }

    return count || 0;
  } catch (error) {
    console.error('Error in countServicePackages:', error);
    return 0; // Return 0 instead of throwing for count operations
  }
};

/* =========================
   GET SERVICE CATEGORIES
========================= */
export const getServiceCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching service categories:', error);
      // Don't throw here, just return empty array as categories are optional
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getServiceCategories:', error);
    return [];
  }
};

/* =========================
   GET CATEGORY BY SLUG
========================= */
export const getCategoryBySlug = async (slug: string) => {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCategoryBySlug:', error);
    return null;
  }
};

/* =========================
   BATCH OPERATIONS
========================= */

// Bulk update package status
export const bulkUpdatePackageStatus = async (
  packageIds: string[],
  isActive: boolean
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('service_packages')
      .update({ is_active: isActive })
      .in('id', packageIds)
      .select();

    if (error) {
      console.error('Error bulk updating packages:', error);
      throw new PackageServiceError('Failed to bulk update packages', error);
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in bulkUpdatePackageStatus:', error);
    throw error instanceof PackageServiceError ? error : new PackageServiceError('An unexpected error occurred', error);
  }
};

// Delete multiple packages
export const bulkDeletePackages = async (packageIds: string[]): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('service_packages')
      .delete()
      .in('id', packageIds)
      .select();

    if (error) {
      console.error('Error bulk deleting packages:', error);
      throw new PackageServiceError('Failed to bulk delete packages', error);
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in bulkDeletePackages:', error);
    throw error instanceof PackageServiceError ? error : new PackageServiceError('An unexpected error occurred', error);
  }
};
