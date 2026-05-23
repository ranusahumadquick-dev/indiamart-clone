import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

// Import Product model
import('./backend/src/models/Product.js').then(async ({ default: Product }) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    // Working solar panel images
    const workingSolarImages = [
      'https://images.pexels.com/photos/4397830/pexels-photo-4397830.jpeg',
      'https://images.pexels.com/photos/2252921/pexels-photo-2252921.jpeg',
    ];

    const product = await Product.findOne({ name: { $regex: 'Solar Panel', $options: 'i' } });
    
    if (product) {
      console.log('🌞 Updating Solar Panel images...\n');
      product.images = workingSolarImages.map((url, idx) => ({
        url,
        alt: `Solar Panel - Image ${idx + 1}`,
        type: 'image',
      }));

      await product.save();
      console.log('✅ Solar Panel updated with working images!');
      console.log('\n📸 New Images:');
      product.images.forEach((img, i) => {
        console.log(`  ${i+1}. ${img.url}`);
      });
    } else {
      console.log('❌ Solar Panel product not found');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
});
