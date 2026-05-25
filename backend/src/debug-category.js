import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema, 'products');

async function debugCategory() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Get products with unpopulated category
    const products = await Product.find().limit(3).lean();

    console.log('Products with unpopulated category:');
    products.forEach(p => {
      console.log(`\nName: ${p.name}`);
      console.log(`Category (raw): ${JSON.stringify(p.category)}`);
    });

    // Now populate and check
    const productsPopulated = await Product.find()
      .populate('category', 'name slug')
      .limit(3)
      .lean();

    console.log('\n\n═══════════════════════════════════════════');
    console.log('Products WITH populated category:');
    console.log('═══════════════════════════════════════════\n');

    productsPopulated.forEach(p => {
      console.log(`Name: ${p.name}`);
      console.log(`Category type: ${typeof p.category}`);
      console.log(`Category: ${JSON.stringify(p.category, null, 2)}`);
      console.log(`Category.name: ${p.category?.name || 'UNDEFINED'}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

debugCategory();
