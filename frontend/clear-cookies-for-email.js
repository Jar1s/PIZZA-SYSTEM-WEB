// Script to clear cookie settings for jardo.bir@gmail.com
// Copy and paste this into browser console on the website

(function() {
  const targetEmail = 'jardo.bir@gmail.com';
  
  console.log('🔍 Looking for user:', targetEmail);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let foundUserId = null;
  
  // Check customer users
  const customerUser = localStorage.getItem('customer_auth_user');
  if (customerUser) {
    try {
      const user = JSON.parse(customerUser);
      if (user.email === targetEmail || user.email?.toLowerCase() === targetEmail.toLowerCase()) {
        foundUserId = user.id;
        console.log('✅ Found customer user:', user.id, '-', user.email);
      }
    } catch {}
  }
  
  // Check admin users
  if (!foundUserId) {
    const adminUser = localStorage.getItem('auth_user');
    if (adminUser) {
      try {
        const user = JSON.parse(adminUser);
        if (user.email === targetEmail || user.email?.toLowerCase() === targetEmail.toLowerCase() ||
            user.username === targetEmail || user.username?.toLowerCase() === targetEmail.toLowerCase()) {
          foundUserId = user.id;
          console.log('✅ Found admin user:', user.id, '-', user.email || user.username);
        }
      } catch {}
    }
  }
  
  if (!foundUserId) {
    console.log('❌ User with email', targetEmail, 'not found in localStorage.');
    console.log('\n💡 Make sure you are logged in with this account on the current page.');
    return;
  }
  
  // Clear cookie settings
  const analyticsKey = `cookie_analytics_${foundUserId}`;
  const marketingKey = `cookie_marketing_${foundUserId}`;
  
  let cleared = 0;
  if (localStorage.getItem(analyticsKey) !== null) {
    localStorage.removeItem(analyticsKey);
    cleared++;
    console.log('✅ Removed:', analyticsKey);
  }
  if (localStorage.getItem(marketingKey) !== null) {
    localStorage.removeItem(marketingKey);
    cleared++;
    console.log('✅ Removed:', marketingKey);
  }
  
  if (cleared > 0) {
    console.log('\n✅ Successfully cleared', cleared, 'cookie setting(s) for', targetEmail);
    console.log('   Banner should appear on next page load!');
  } else {
    console.log('\nℹ️  No cookie settings found for', targetEmail);
    console.log('   (This is fine - banner will appear on next page load)');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
})();


