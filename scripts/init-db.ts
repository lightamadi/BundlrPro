import mongoose from 'mongoose';
import config from '../src/config/app';
import Bundle from '../src/models/Bundle';

async function initializeDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB successfully');

    // Create indexes
    console.log('Creating indexes...');
    
    // Index for bundles collection
    await Bundle.collection.createIndexes([
      { key: { shopId: 1 }, background: true },
      { key: { 'products.productId': 1 }, background: true },
      { key: { isActive: 1 }, background: true },
      { key: { validFrom: 1, validTo: 1 }, background: true },
      { key: { 'analytics.totalOrders': -1 }, background: true },
      { key: { 'analytics.totalRevenue': -1 }, background: true },
      { key: { createdAt: -1 }, background: true }
    ]);

    console.log('Indexes created successfully');

    // Create any necessary collections
    const collections = await mongoose.connection.db.collections();
    const collectionNames = collections.map(c => c.collectionName);

    if (!collectionNames.includes('bundles')) {
      console.log('Creating bundles collection...');
      await mongoose.connection.db.createCollection('bundles');
      console.log('Bundles collection created successfully');
    }

    // Add any initial data if needed
    const bundlesCount = await Bundle.countDocuments();
    if (bundlesCount === 0) {
      console.log('No bundles found. You can add sample data here if needed.');
    }

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the initialization
initializeDatabase(); 