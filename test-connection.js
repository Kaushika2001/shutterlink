// Test Connection to Existing service_packages Table
// Run this in browser console on http://localhost:3000/provider/packages

async function testDatabaseConnection() {
  console.log('🔍 Testing service_packages table connection...\n');

  // Test 1: Check Supabase client
  console.log('1️⃣ Testing Supabase client...');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  console.log('✅ Supabase client initialized\n');

  // Test 2: Check table exists
  console.log('2️⃣ Checking if service_packages table exists...');
  try {
    const { data, error } = await supabase
      .from('service_packages')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Table check failed:', error.message);
      return;
    }
    console.log('✅ Table exists\n');
  } catch (err) {
    console.error('❌ Error:', err);
    return;
  }

  // Test 3: Check table structure
  console.log('3️⃣ Checking table structure...');
  try {
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Structure check failed:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Sample record found:');
      console.log('Columns:', Object.keys(data[0]));
      console.log('Sample data:', data[0]);
    } else {
      console.log('⚠️  Table is empty (this is OK for new setup)');
    }
    console.log('');
  } catch (err) {
    console.error('❌ Error:', err);
    return;
  }

  // Test 4: Check authentication
  console.log('4️⃣ Checking authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('❌ Not authenticated. Please login first.');
    return;
  }
  console.log('✅ Authenticated as:', user.email);
  console.log('User ID:', user.id);
  console.log('');

  // Test 5: Try to fetch packages for current user
  console.log('5️⃣ Fetching packages for current user...');
  try {
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('provider_id', user.id)
      .order('price', { ascending: true });
    
    if (error) {
      console.error('❌ Fetch failed:', error.message);
      console.log('This might be an RLS policy issue.');
      return;
    }

    console.log(`✅ Found ${data.length} package(s) for this provider`);
    if (data.length > 0) {
      console.log('Packages:', data);
    }
    console.log('');
  } catch (err) {
    console.error('❌ Error:', err);
    return;
  }

  // Test 6: Check required columns
  console.log('6️⃣ Verifying required columns...');
  const requiredColumns = [
    'id',
    'provider_id',
    'name',
    'description',
    'service_type',
    'price',
    'deliverables',
    'max_revisions',
    'is_active',
    'created_at',
    'updated_at'
  ];

  try {
    const { data: schema } = await supabase
      .from('service_packages')
      .select('*')
      .limit(1);

    if (schema && schema.length > 0) {
      const columns = Object.keys(schema[0]);
      const missing = requiredColumns.filter(col => !columns.includes(col));
      
      if (missing.length > 0) {
        console.error('❌ Missing columns:', missing);
      } else {
        console.log('✅ All required columns present');
      }
    } else {
      console.log('⚠️  Cannot verify columns (table is empty)');
      console.log('Try creating a package through the UI first.');
    }
  } catch (err) {
    console.log('⚠️  Column verification skipped');
  }

  console.log('\n✅ CONNECTION TEST COMPLETE!');
  console.log('\nNext steps:');
  console.log('1. If all tests passed, try creating a package through the UI');
  console.log('2. If any tests failed, check the error messages above');
  console.log('3. Review TABLE_VERIFICATION.md for fixing issues');
}

// Run the test
testDatabaseConnection();
