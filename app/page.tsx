import { supabase } from '@/lib/supabaseClient';

export default async function Home() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  console.log('DATA:', data);
  console.log('ERROR:', error);

  return (
    <div>
      <h1>Supabase Connection Test</h1>
      {error ? (
        <p style={{ color: 'red' }}>Connection Failed ❌</p>
      ) : (
        <p style={{ color: 'green' }}>Supabase Connected ✅</p>
      )}
    </div>
  );
}
