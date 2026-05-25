# Product Images Setup Guide

## Overview
The system automatically fetches real product images based on product names and categories. To enable this feature, you need to configure API keys for image services.

## Getting Free API Keys

### Option 1: Pexels (Recommended - Free & Reliable)
1. Visit: https://www.pexels.com/api/
2. Click "Get Started"
3. Fill in basic info (Name, Email, Website)
4. Get your free API key instantly
5. Copy the API key

### Option 2: Unsplash (Fallback Option)
1. Visit: https://unsplash.com/oauth/applications
2. Click "Create a new application"
3. Accept terms and click "Create application"
4. Fill in required fields
5. Get your Access Key from the "Keys" section

## Configuration

### Step 1: Update `.env` file
Add these lines to `backend/.env`:

```
# Image APIs - Get free keys from pexels.com and unsplash.com
PEXELS_API_KEY=your_pexels_api_key_here
UNSPLASH_API_KEY=your_unsplash_api_key_here
```

### Step 2: Restart the server
```bash
npm run dev
```

## How It Works

### Image Matching Process
1. **Extract Product Keyword** from product name
   - "Solar Panel XYZ" → "solar panel" keyword
   - "Laptop Computer" → "laptop" keyword
   - "Camera HD" → "camera" keyword

2. **Search for Image** using the keyword
   - First tries Pexels API (faster)
   - Falls back to Unsplash (if Pexels fails)
   - Falls back to category-based default images

3. **Cache the Image** to avoid repeated API calls
   - Same product won't call API twice

### Supported Product Categories (Auto-Mapped)

**Electronics & Gadgets:**
- Laptop, Camera, Smartphone, Tablet, Monitor, Keyboard, Headphones, Speaker, Charger

**Fabrics & Textiles:**
- Cotton, Silk, Polyester, Saree, Denim, Linen, Wool

**Raw Materials:**
- Steel, Copper, Aluminum, Plastic, Rubber, Glass, Wood

**Machinery:**
- Pump, Motor, Compressor, Generator, Conveyor, Grinding Machine

**Electrical:**
- Solar Panel, LED, Wire, Battery, Transformer, Socket, Switch

**Food & Agriculture:**
- Rice, Spices, Oil, Tea, Coffee, Wheat, Flour, Honey

**Tools & Hardware:**
- Drill, Saw, Wrench, Hammer, Screws, Pliers

**Furniture:**
- Chair, Table, Desk, Sofa, Bed, Wardrobe

**And many more...**

## Testing the System

### Test with Sample Products:
```bash
# Solar Panel Product
curl "http://localhost:8000/api/images/products/test1/image?title=Solar%20Panel%2010W&category=electrical"

# Laptop Computer
curl "http://localhost:8000/api/images/products/test2/image?title=Laptop%20i7%2016GB&category=electronics"

# Camera Professional
curl "http://localhost:8000/api/images/products/test3/image?title=Camera%20HD%201080p&category=electronics"
```

## Troubleshooting

### Images still showing defaults?
1. **Check API keys are set** in `backend/.env`
2. **Restart the server** for environment variables to load
3. **Check server logs** for any API errors
4. **Verify internet connection** can reach Pexels/Unsplash

### API rate limits?
- **Pexels**: 200 requests/hour (free tier)
- **Unsplash**: 50 requests/hour (free tier)
- Images are cached after first fetch, so limits won't be hit often

### Want to add more products?
Edit `backend/src/services/productImageService.js` and add to `productKeywordMapping` object

## Benefits

✅ **Automatic**: No manual image uploads needed
✅ **Accurate**: Images match product names perfectly
✅ **Fast**: Images cached after first fetch
✅ **Reliable**: Multiple API fallbacks
✅ **Free**: Uses free tier APIs
✅ **Scalable**: Handles thousands of products

## Example Products

| Product Name | Detected Keyword | Image Type |
|---|---|---|
| Solar Panel 50W | solar panel | Solar panels |
| Laptop i7 16GB | laptop | Laptops |
| Canon Camera EOS | camera | Cameras |
| Cotton Fabric 100m | cotton | Cotton fabric |
| Steel Pipe 2 inch | steel pipe | Steel pipes |
| LED Light 18W | led | LED lights |
| Coffee Beans 1kg | coffee | Coffee beans |
| Power Drill 18V | drill | Power drills |
| Office Chair | chair | Office chairs |
| Motorcycle Bike | bike | Motorcycles |

## Next Steps

1. Get API keys from Pexels/Unsplash
2. Add them to `backend/.env`
3. Restart the server
4. Visit any product page to see real images
5. Add more product keywords as needed
