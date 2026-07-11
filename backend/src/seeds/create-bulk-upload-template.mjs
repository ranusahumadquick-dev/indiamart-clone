import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV Template for bulk product upload
const csvTemplate = `name,description,price,comparePrice,currency,priceUnit,category,stock,sku,images
Pure Cotton Fabric,Premium cotton fabric,120,180,INR,Meter,Textiles & Apparel,500,SKU001,https://picsum.photos/600/600?random=1;https://picsum.photos/600/600?random=2
LED Panel Light,18W LED panel,5000,7500,INR,Piece,Electrical,200,SKU002,https://picsum.photos/600/600?random=3;https://picsum.photos/600/600?random=4
Hydraulic Cylinder,Heavy duty cylinder,12500,16000,INR,Piece,Industrial Equipment,100,SKU003,https://picsum.photos/600/600?random=5;https://picsum.photos/600/600?random=6
Packaging Machine,Automatic pouch packing,250000,350000,INR,Piece,Packaging Machines,25,SKU004,https://picsum.photos/600/600?random=7;https://picsum.photos/600/600?random=8
Solar Panel,400W monocrystalline,45000,60000,INR,Piece,Renewable Energy,150,SKU005,https://picsum.photos/600/600?random=9;https://picsum.photos/600/600?random=10
Urea Fertilizer,46% nitrogen grade,500,750,INR,Kg,Fertilizers,1000,SKU006,https://picsum.photos/600/600?random=11;https://picsum.photos/600/600?random=12
Woven Sacks,25-100kg capacity,50,80,INR,Piece,Packaging,5000,SKU007,https://picsum.photos/600/600?random=13;https://picsum.photos/600/600?random=14
Steel Pipe,304 grade seamless,1200,1800,INR,Meter,Industrial,300,SKU008,https://picsum.photos/600/600?random=15;https://picsum.photos/600/600?random=16
`;

const templatePath = path.join(__dirname, '../../..', 'BULK_UPLOAD_TEMPLATE.csv');

fs.writeFileSync(templatePath, csvTemplate);
console.log('✅ Template created: BULK_UPLOAD_TEMPLATE.csv');
console.log('\n📋 CSV Format:');
console.log('- name: Product name (required)');
console.log('- description: Product description');
console.log('- price: Selling price (required)');
console.log('- comparePrice: Original price');
console.log('- currency: Currency (INR, USD, etc)');
console.log('- priceUnit: Unit (Piece, Meter, Kg, etc)');
console.log('- category: Product category');
console.log('- stock: Quantity in stock');
console.log('- sku: Stock keeping unit');
console.log('- images: Image URLs separated by semicolon (;)');
