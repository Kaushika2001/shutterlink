import { supabase } from '@/lib/supabaseClient';

/**
 * Get provider profile ID from user ID
 * Since service_packages references provider_profiles(id), not auth.users(id)
 */
export async function getProviderProfileId(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching provider profile:', error);
      return null;
    }

    return data?.id || null;
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
    const { data, error } = await supabase
      .from('provider_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching provider profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getProviderProfileByUserId:', error);
    return null;
  }
}
