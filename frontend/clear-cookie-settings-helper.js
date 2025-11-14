// Copy and paste this code into your browser console on the website where you're logged in

(function() {
  console.log('🍪 Cookie Settings Helper');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Get current users
  const users = [];
  
  const customerUser = localStorage.getItem('customer_auth_user');
  if (customerUser) {
    try {
      const user = JSON.parse(customerUser);
      users.push({
        id: user.id,
        email: user.email || user.name || 'N/A',
        type: 'Customer'
      });
    } catch {}
  }
  
  const adminUser = localStorage.getItem('auth_user');
  if (adminUser) {
    try {
      const user = JSON.parse(adminUser);
      users.push({
        id: user.id,
        email: user.email || user.username || user.name || 'N/A',
        type: 'Admin'
      });
    } catch {}
  }
  
  if (users.length === 0) {
    console.log('❌ No users found. Make sure you are logged in.');
    return;
  }
  
  console.log('\n📱 Current Users:');
  users.forEach((user, i) => {
    console.log(`${i + 1}. ${user.id} (${user.email}) - ${user.type}`);
  });
  
  // Get cookie settings
  const settings = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('cookie_')) {
      settings.push({ key, value: localStorage.getItem(key) });
    }
  }
  
  console.log('\n🍪 Cookie Settings:');
  if (settings.length === 0) {
    console.log('   No cookie settings found.');
  } else {
    settings.forEach(s => {
      console.log(`   ${s.key}: ${s.value}`);
    });
  }
  
  // Helper function to clear settings for a user
  window.clearCookieSettings = function(userId) {
    const analyticsKey = `cookie_analytics_${userId}`;
    const marketingKey = `cookie_marketing_${userId}`;
    
    let cleared = 0;
    if (localStorage.getItem(analyticsKey) !== null) {
      localStorage.removeItem(analyticsKey);
      cleared++;
      console.log(`✅ Removed: ${analyticsKey}`);
    }
    if (localStorage.getItem(marketingKey) !== null) {
      localStorage.removeItem(marketingKey);
      cleared++;
      console.log(`✅ Removed: ${marketingKey}`);
    }
    
    if (cleared > 0) {
      console.log(`\n✅ Cleared ${cleared} cookie setting(s) for user ${userId}`);
      console.log('   Banner should appear on next page load!');
    } else {
      console.log(`\nℹ️  No cookie settings found for user ${userId}`);
    }
    
    return cleared;
  };
  
  console.log('\n💡 Usage:');
  console.log('   clearCookieSettings("USER_ID")');
  console.log('   Example: clearCookieSettings("' + (users[0]?.id || 'user-123') + '")');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
})();


