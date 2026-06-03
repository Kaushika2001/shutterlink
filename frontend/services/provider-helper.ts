import { getProviderProfile } from './provider';

/**
 * Get provider profile ID from user ID
 * Since service_packages references provider_profiles(id), not auth.users(id)
 */
export async function getProviderProfileId(userId: string): Promise<string | null> {
  try {
    const profile = await getProviderProfile(userId);
    return profile?.id || null;
  } catch (error) {
    console.error('Error in getProviderProfileId:', error);
    return null;
  }
}

/**
 * Get full provider profile by user ID
 */
export async function getProviderProfileByUserId(userId: string) {
  try {
    return await getProviderProfile(userId);
  } catch (error) {
    console.error('Error in getProviderProfileByUserId:', error);
    return null;
  }
}
