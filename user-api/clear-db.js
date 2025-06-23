import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Create readline interface for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// MongoDB Connection URI
const MONGODB_URI = "mongodb+srv://user-admin:user-admin@customerservicechat.4uk1s.mongodb.net/?retryWrites=true&w=majority&appName=CustomerServiceChat";

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is missing.');
  process.exit(1);
}

async function clearDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.collections();
    
    console.log('Found collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.collectionName}`);
    });

    rl.question('Are you sure you want to clear all collections? This action cannot be undone. (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        console.log('Clearing collections...');
        
        // Drop each collection
        for (const collection of collections) {
          await collection.deleteMany({});
          console.log(`Cleared collection: ${collection.collectionName}`);
        }
        
        console.log('All collections have been cleared successfully.');
      } else {
        console.log('Operation cancelled.');
      }
      
      // Close the connection
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      
      // Exit the process
      rl.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

// Execute the clear function
clearDatabase();