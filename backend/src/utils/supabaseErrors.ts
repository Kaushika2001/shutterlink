/** PostgREST / Postgres errors when a table was never migrated */
export function isMissingTableError(error: { message?: string; details?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const msg = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  const mentionsColumn = msg.includes('column');
  return (
    !mentionsColumn &&
    (msg.includes('could not find the table') ||
      (msg.includes('schema cache') && msg.includes('table')) ||
      (msg.includes('relation') && msg.includes('does not exist')) ||
      (msg.includes('not found') && msg.includes('table'))) ||
    error.code === '42P01' ||
    error.code === 'PGRST205'
  );
}

export const AVAILABILITY_SETUP_HINT =
  'Availability tables are not set up. Run backend/supabase/RUN_AVAILABILITY_SETUP.sql in Supabase SQL Editor.';

/** Column name mismatch between app and database */
export function isMissingColumnError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    (msg.includes('column') && (msg.includes('schema cache') || msg.includes('does not exist'))) ||
    error.code === '42703' ||
    error.code === 'PGRST204'
  );
}

export const REVIEWS_SETUP_HINT =
  'Reviews table needs provider_id. Run backend/supabase/RUN_REVIEWS_SETUP.sql in Supabase SQL Editor.';
