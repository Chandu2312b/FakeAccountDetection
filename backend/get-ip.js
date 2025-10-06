import https from 'https';

console.log('🌐 Getting your current IP address...');

https.get('https://api.ipify.org?format=json', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ Your current IP address is:', result.ip);
      console.log('\n📋 Next steps:');
      console.log('1. Go to MongoDB Atlas: https://cloud.mongodb.com/');
      console.log('2. Navigate to your cluster');
      console.log('3. Click "Network Access" in the left sidebar');
      console.log('4. Click "Add IP Address"');
      console.log(`5. Add this IP: ${result.ip}`);
      console.log('6. Or add 0.0.0.0/0 for development (not recommended for production)');
      console.log('\n🚀 After whitelisting, run: node test-connection.js');
    } catch (error) {
      console.error('❌ Error parsing IP response:', error.message);
    }
  });
}).on('error', (error) => {
  console.error('❌ Error getting IP address:', error.message);
  console.log('\n📋 Manual steps:');
  console.log('1. Go to https://whatismyipaddress.com/');
  console.log('2. Copy your IP address');
  console.log('3. Go to MongoDB Atlas Network Access');
  console.log('4. Add your IP address to the whitelist');
});



