/**
 * VIEW EXISTING PORTFOLIOS
 * 
 * Simple Node.js script to view portfolio items from the database
 * Run with: node view-portfolios.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function viewPortfolios() {
  console.log('\n🎨 PORTFOLIO VIEWER\n');
  console.log('═'.repeat(80));
  
  try {
    // Check if table exists
    console.log('\n📊 Checking portfolio_items table...\n');
    
    const { data: items, error, count } = await supabase
      .from('portfolio_items')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error:', error.message);
      console.log('\n💡 Possible reasons:');
      console.log('   1. Table does not exist yet - run migrations first');
      console.log('   2. RLS policies blocking access');
      console.log('   3. Database connection issue');
      console.log('\n📝 To fix: Run the SQL migrations from:');
      console.log('   - supabase/migrations/002_portfolio_items_table.sql');
      return;
    }
    
    if (!items || items.length === 0) {
      console.log('📭 No portfolio items found in database\n');
      console.log('💡 To add items:');
      console.log('   1. Login as a provider');
      console.log('   2. Go to /provider/portfolio');
      console.log('   3. Click "Add Item" and upload images\n');
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
      
      console.log(`   Image URL:   ${item.image_url}`);
      console.log(`   Created:     ${new Date(item.created_at).toLocaleString()}`);
      console.log(`   Updated:     ${new Date(item.updated_at).toLocaleString()}`);
    });
    
    console.log('\n' + '═'.repeat(80));
    
    // Get provider profiles info
    console.log('\n👥 Provider Profiles Summary:\n');
    
    const { data: profiles } = await supabase
      .from('provider_profiles')
      .select('id, business_name, service_type');
    
    if (profiles && profiles.length > 0) {
      profiles.forEach(profile => {
        const itemCount = items.filter(i => i.provider_id === profile.id).length;
        if (itemCount > 0) {
          console.log(`   ${profile.business_name || 'Unnamed'}: ${itemCount} items`);
        }
      });
    }
    
    console.log('\n' + '═'.repeat(80));
    
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
    
    console.log('\n' + '═'.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the viewer
viewPortfolios();
