// View Existing Portfolios - Run in Browser Console
// Open http://localhost:3000 and paste this entire script into the browser console

async function viewPortfolios() {
  console.log('\n🎨 PORTFOLIO VIEWER\n');
  console.log('═'.repeat(80));
  
  try {
    // Import Supabase
    console.log('📡 Connecting to database...\n');
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    // Get env vars from window (Next.js exposes NEXT_PUBLIC_* vars)
    const supabaseUrl = window.ENV?.NEXT_PUBLIC_SUPABASE_URL || 
                        'https://tvxoeybxlzwnpszdqiup.supabase.co';
    const supabaseKey = window.ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2eG9leWJ4bHp3bnBzemRxaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MTg2NTAsImV4cCI6MjA1Mzk5NDY1MH0.w_0Cp0FrT9sAZXzpIbYiGHbg-2tNHRsQaOp9C0lsxmY';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connected\n');
    
    // Check portfolio_items table
    console.log('📊 Checking portfolio_items table...\n');
    
    const { data: items, error, count } = await supabase
      .from('portfolio_items')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error:', error.message);
      console.log('\n💡 Possible reasons:');
      console.log('   1. Table does not exist yet - run migrations first');
      console.log('   2. Check: supabase/migrations/002_portfolio_items_table.sql');
      return;
    }
    
    if (!items || items.length === 0) {
      console.log('📭 No portfolio items found\n');
      console.log('💡 To add items:');
      console.log('   1. Login as a provider');
      console.log('   2. Go to /provider/portfolio');
      console.log('   3. Click "Add Item"\n');
      return;
    }
    
    console.log(`✅ Found ${count} portfolio items\n`);
    console.log('═'.repeat(80));
    
    // Display each item
    items.forEach((item, index) => {
      console.log(`\n[${index + 1}] ${item.title}`);
      console.log('─'.repeat(80));
      console.log(`   ID:          ${item.id}`);
      console.log(`   Provider ID: ${item.provider_id}`);
      console.log(`   Category:    ${item.category || 'Uncategorized'}`);
      console.log(`   Featured:    ${item.is_featured ? '⭐ Yes' : 'No'}`);
      console.log(`   Order:       ${item.display_order}`);
      
      if (item.description) {
        const desc = item.description.length > 100 
          ? item.description.substring(0, 100) + '...'
          : item.description;
        console.log(`   Description: ${desc}`);
      }
      
      console.log(`   Image:       ${item.image_url}`);
      console.log(`   Created:     ${new Date(item.created_at).toLocaleString()}`);
    });
    
    console.log('\n' + '═'.repeat(80));
    
    // Get provider profiles
    console.log('\n👥 Provider Profiles:\n');
    
    const { data: profiles } = await supabase
      .from('provider_profiles')
      .select('id, business_name, service_type, user_id');
    
    if (profiles && profiles.length > 0) {
      profiles.forEach(profile => {
        const itemCount = items.filter(i => i.provider_id === profile.id).length;
        if (itemCount > 0) {
          console.log(`   ${profile.business_name || 'Unnamed Business'}`);
          console.log(`   - Profile ID: ${profile.id}`);
          console.log(`   - User ID: ${profile.user_id}`);
          console.log(`   - Services: ${profile.service_type?.join(', ') || 'N/A'}`);
          console.log(`   - Portfolio Items: ${itemCount}\n`);
        }
      });
    }
    
    console.log('═'.repeat(80));
    
    // Category breakdown
    const categories = {};
    items.forEach(item => {
      const cat = item.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    
    console.log('\n📂 By Category:\n');
    Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count} items`);
      });
    
    console.log('\n' + '═'.repeat(80));
    
    // Featured items
    const featuredCount = items.filter(i => i.is_featured).length;
    console.log(`\n⭐ Featured Items: ${featuredCount} of ${count}`);
    
    if (featuredCount > 0) {
      console.log('\nFeatured:');
      items
        .filter(i => i.is_featured)
        .forEach(item => {
          console.log(`   - ${item.title} (${item.category || 'Uncategorized'})`);
        });
    }
    
    console.log('\n' + '═'.repeat(80));
    
    // Return data for further inspection
    console.log('\n💡 Tip: The data is also returned. Type "window.portfolioData" to access it.\n');
    window.portfolioData = { items, profiles };
    return { items, profiles };
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the viewer
viewPortfolios();
