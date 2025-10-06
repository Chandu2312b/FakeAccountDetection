import fs from 'fs';
import path from 'path';

const envContent = `# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://bchandu2385_db_user:Chandu%40238@cluster0.47cssvl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# Server Configuration
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Environment
NODE_ENV=development
`;

const envPath = path.join(process.cwd(), '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📁 Location:', envPath);
  console.log('🔗 MongoDB Atlas connection string configured');
  console.log('\n🚀 You can now run:');
  console.log('   node test-connection.js  # Test the connection');
  console.log('   npm run dev             # Start the server');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('\n📝 Please create .env file manually with this content:');
  console.log('─'.repeat(50));
  console.log(envContent);
  console.log('─'.repeat(50));
}
