/** PostgREST / Postgres errors when a table was never migrated */
export function isMissingTableError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const msg = error.message || '';
  return (
    msg.includes('Could not find the table') ||
    msg.includes('schema cache') ||
    error.code === '42P01' ||
    error.code === 'PGRST205'
  );
}

/** Column name mismatch between app and database */
export function isMissingColumnError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const msg = error.message || '';
  return (msg.includes('does not exist') && msg.includes('column')) || error.code === '42703';
}
