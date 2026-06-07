import mongoose from "mongoose";

// ╔═════════════════════════════════════════════════════════════════╗
// ║              AUTO-VARIANT GENERATION MAPPING                   ║
// ║  Category-based automatic variant templates                    ║
// ╚═════════════════════════════════════════════════════════════════╝

const AUTO_VARIANTS = {
  // ─── FOOD & BEVERAGES ──────────────────────────────
  food: {
    default: [
      { name: "Weight", values: ["100g","250g","500g","1kg","2kg","5kg"] },
      { name: "Pack Type", values: ["Loose","Packet","Box","Jar","Pouch"] },
      { name: "Grade", values: ["Regular","Premium","Organic"] }
    ],
    "grains-pulses": [
      { name: "Weight", values: ["250g","500g","1kg","2kg","5kg","10kg","25kg"] },
      { name: "Pack Type", values: ["Loose","Sealed Packet","Vacuum Pack","Jute Bag"] },
      { name: "Grade", values: ["Regular","Premium","Organic","Export Quality"] }
    ],
    dairy: [
      { name: "Quantity", values: ["100ml","200ml","500ml","1L","2L","5L"] },
      { name: "Fat %", values: ["Skimmed","Low Fat","Full Cream","Double Cream"] },
      { name: "Pack", values: ["Pouch","Bottle","Tetrapack","Jar"] }
    ],
    spices: [
      { name: "Weight", values: ["50g","100g","200g","500g","1kg"] },
      { name: "Form", values: ["Whole","Powder","Paste","Flakes"] },
      { name: "Grade", values: ["Regular","Premium","Organic"] }
    ],
    beverages: [
      { name: "Volume", values: ["200ml","250ml","500ml","750ml","1L","2L"] },
      { name: "Type", values: ["Regular","Diet","Zero Sugar","Decaf"] },
      { name: "Pack", values: ["Bottle","Can","Tetrapack","Sachet"] }
    ],
    snacks: [
      { name: "Weight", values: ["50g","100g","200g","500g"] },
      { name: "Flavor", values: ["Plain","Spicy","Sweet","Salty","Tangy"] },
      { name: "Pack", values: ["Single","Pack of 2","Pack of 5","Family Pack"] }
    ],
    sweets: [
      { name: "Weight", values: ["250g","500g","1kg","2kg"] },
      { name: "Flavor", values: ["Kaju","Badam","Pista","Mixed","Chocolate"] },
      { name: "Pack", values: ["Box","Loose","Gift Pack","Tin"] }
    ],
    "dry-fruits": [
      { name: "Weight", values: ["100g","250g","500g","1kg"] },
      { name: "Grade", values: ["Regular","Premium","Export Quality"] },
      { name: "Pack", values: ["Pouch","Box","Jar","Tin"] }
    ]
  },

  // ─── AGRICULTURE ───────────────────────────────────
  agriculture: {
    default: [
      { name: "Weight", values: ["500g","1kg","5kg","10kg"] },
      { name: "Grade", values: ["A Grade","B Grade","Organic"] },
      { name: "Season", values: ["Kharif","Rabi","All Season"] }
    ],
    fruits: [
      { name: "Weight", values: ["500g","1kg","2kg","5kg","10kg"] },
      { name: "Grade", values: ["A Grade","B Grade","Export Quality","Local"] },
      { name: "Variety", values: ["Local","Hybrid","Organic","Imported"] }
    ],
    vegetables: [
      { name: "Weight", values: ["250g","500g","1kg","2kg","5kg"] },
      { name: "Type", values: ["Fresh","Organic","Hydroponic","Farm Direct"] },
      { name: "Pack", values: ["Loose","Net Bag","Crate","Box"] }
    ],
    seeds: [
      { name: "Weight", values: ["50g","100g","250g","500g","1kg"] },
      { name: "Variety", values: ["Hybrid","Open Pollinated","Heirloom","Organic"] },
      { name: "Season", values: ["Kharif","Rabi","Zaid","All Season"] }
    ],
    fertilizers: [
      { name: "Weight", values: ["1kg","5kg","10kg","25kg","50kg"] },
      { name: "Type", values: ["Organic","Chemical","Bio","Granular","Liquid"] },
      { name: "NPK Ratio", values: ["10-10-10","12-32-16","19-19-19","Custom"] }
    ],
    pesticides: [
      { name: "Volume/Weight", values: ["100ml","250ml","500ml","1L","1kg"] },
      { name: "Type", values: ["Organic","Chemical","Bio-Pesticide"] },
      { name: "Target", values: ["Insecticide","Fungicide","Herbicide","All Purpose"] }
    ],
    herbs: [
      { name: "Weight", values: ["50g","100g","250g","500g"] },
      { name: "Form", values: ["Fresh","Dried","Powdered","Extract"] },
      { name: "Grade", values: ["Regular","Organic","Medicinal"] }
    ],
    flowers: [
      { name: "Quantity", values: ["10 pcs","25 pcs","50 pcs","100 pcs"] },
      { name: "Grade", values: ["A Grade","B Grade","Export Quality"] },
      { name: "Pack", values: ["Loose","Bunch","Box"] }
    ]
  },

  // ─── CLOTHING & APPAREL ────────────────────────────
  clothing: {
    default: [
      { name: "Size", values: ["XS","S","M","L","XL","XXL"] },
      { name: "Color", values: ["White","Black","Red","Blue","Green"] },
      { name: "Material", values: ["Cotton","Polyester","Linen"] }
    ],
    men: [
      { name: "Size", values: ["XS","S","M","L","XL","XXL","3XL"] },
      { name: "Color", values: ["White","Black","Navy","Grey","Brown","Olive"] },
      { name: "Fit", values: ["Regular","Slim","Relaxed","Oversized"] },
      { name: "Material", values: ["Cotton","Polyester","Linen","Blended"] }
    ],
    women: [
      { name: "Size", values: ["XS","S","M","L","XL","XXL"] },
      { name: "Color", values: ["White","Black","Red","Pink","Blue","Yellow"] },
      { name: "Style", values: ["Casual","Formal","Party","Ethnic"] },
      { name: "Material", values: ["Cotton","Chiffon","Silk","Polyester"] }
    ],
    kids: [
      { name: "Age Group", values: ["0-1yr","1-2yr","2-4yr","4-6yr","6-8yr","8-10yr","10-12yr"] },
      { name: "Color", values: ["Red","Blue","Yellow","Green","Pink","Orange"] },
      { name: "Material", values: ["Soft Cotton","Fleece","Denim","Jersey"] }
    ],
    traditional: [
      { name: "Size", values: ["XS","S","M","L","XL","XXL"] },
      { name: "Color", values: ["Red","Green","Yellow","Blue","Maroon","Orange","White"] },
      { name: "Work", values: ["Plain","Embroidered","Printed","Zari","Bandhani"] },
      { name: "Fabric", values: ["Cotton","Silk","Georgette","Crepe","Rayon"] }
    ],
    sportswear: [
      { name: "Size", values: ["XS","S","M","L","XL","XXL"] },
      { name: "Color", values: ["Black","White","Blue","Red","Green","Yellow"] },
      { name: "Material", values: ["Dri-Fit","Polyester","Spandex","Mesh"] }
    ],
    "winter-wear": [
      { name: "Size", values: ["S","M","L","XL","XXL","3XL"] },
      { name: "Color", values: ["Black","Navy","Grey","Brown","Maroon","Camel"] },
      { name: "Material", values: ["Wool","Fleece","Down","Acrylic","Blended"] },
      { name: "Thickness", values: ["Light","Medium","Heavy","Extra Heavy"] }
    ]
  },

  // ─── FOOTWEAR ──────────────────────────────────────
  footwear: {
    default: [
      { name: "Size (UK)", values: ["5","6","7","8","9","10","11"] },
      { name: "Color", values: ["Black","Brown","White","Grey"] },
      { name: "Material", values: ["Leather","Synthetic","Canvas","Mesh"] }
    ],
    men: [
      { name: "Size (UK)", values: ["6","7","8","9","10","11","12"] },
      { name: "Color", values: ["Black","Brown","White","Tan","Navy"] },
      { name: "Type", values: ["Formal","Casual","Sports","Sandal","Slipper"] }
    ],
    women: [
      { name: "Size (UK)", values: ["3","4","5","6","7","8"] },
      { name: "Color", values: ["Black","White","Nude","Red","Pink","Gold"] },
      { name: "Heel", values: ["Flat","Low Heel","Mid Heel","High Heel","Wedge"] }
    ],
    kids: [
      { name: "Size (UK)", values: ["1","2","3","4","5","6","7","8"] },
      { name: "Color", values: ["Black","White","Blue","Red","Pink","Yellow"] },
      { name: "Type", values: ["School","Sports","Casual","Sandal"] }
    ]
  },

  // ─── ELECTRONICS ───────────────────────────────────
  electronics: {
    default: [
      { name: "Color", values: ["Black","White","Silver","Space Grey"] },
      { name: "Variant", values: ["Standard","Plus","Pro","Max"] },
      { name: "Warranty", values: ["6 Months","1 Year","2 Years"] }
    ],
    mobile: [
      { name: "Storage", values: ["64GB","128GB","256GB","512GB","1TB"] },
      { name: "RAM", values: ["4GB","6GB","8GB","12GB","16GB"] },
      { name: "Color", values: ["Black","White","Blue","Gold","Silver","Green"] }
    ],
    laptop: [
      { name: "RAM", values: ["4GB","8GB","16GB","32GB","64GB"] },
      { name: "Storage", values: ["256GB SSD","512GB SSD","1TB HDD","1TB SSD","2TB"] },
      { name: "Color", values: ["Silver","Space Grey","Gold","Black"] }
    ],
    audio: [
      { name: "Type", values: ["In-Ear","On-Ear","Over-Ear","Neckband","Speaker"] },
      { name: "Connectivity", values: ["Wired","Bluetooth","2.4GHz","Hybrid"] },
      { name: "Color", values: ["Black","White","Blue","Red","Grey"] }
    ],
    tv: [
      { name: "Screen Size", values: ["32 inch","43 inch","50 inch","55 inch","65 inch","75 inch"] },
      { name: "Resolution", values: ["HD","Full HD","4K","8K"] },
      { name: "Type", values: ["LED","OLED","QLED","AMOLED"] }
    ],
    camera: [
      { name: "Type", values: ["DSLR","Mirrorless","Point & Shoot","Action","Security"] },
      { name: "Resolution", values: ["12MP","24MP","48MP","64MP","108MP"] },
      { name: "Color", values: ["Black","Silver","White"] }
    ],
    accessories: [
      { name: "Color", values: ["Black","White","Blue","Red","Green","Grey"] },
      { name: "Compatibility", values: ["Universal","iOS","Android","Windows"] },
      { name: "Pack", values: ["Single","Pack of 2","Pack of 3","Combo"] }
    ]
  },

  // ─── ATTRIBUTE-BASED PRICING (Multiple Categories) ───────
  // Structure: { category: { subCategory: { "attribute-name": { "value": cost } } } }
  attributePricing: {
    // ELECTRONICS
    electronics: {
      laptop: {
        RAM: { "4GB": 0, "8GB": 15000, "16GB": 35000, "32GB": 65000, "64GB": 120000 },
        Storage: { "256GB SSD": 0, "512GB SSD": 5000, "1TB HDD": 8000, "1TB SSD": 12000, "2TB": 20000 },
        Color: { "Silver": 0, "Space Grey": 1000, "Gold": 2000, "Black": 500 }
      },
      mobile: {
        RAM: { "4GB": 0, "6GB": 5000, "8GB": 10000, "12GB": 18000, "16GB": 28000 },
        Storage: { "64GB": 0, "128GB": 5000, "256GB": 12000, "512GB": 25000, "1TB": 45000 },
        Color: { "Black": 0, "White": 0, "Blue": 1000, "Gold": 1500, "Silver": 800 }
      },
      audio: {
        Type: { "In-Ear": 0, "On-Ear": 2000, "Over-Ear": 5000, "Neckband": 3000, "Speaker": 8000 },
        Connectivity: { "Wired": 0, "Bluetooth": 3000, "2.4GHz": 2500, "Hybrid": 4000 },
        Color: { "Black": 0, "White": 500, "Blue": 500, "Red": 500, "Grey": 500 }
      },
      tv: {
        "Screen Size": { "32 inch": 0, "43 inch": 10000, "50 inch": 20000, "55 inch": 30000, "65 inch": 50000, "75 inch": 80000 },
        Resolution: { "HD": 0, "Full HD": 5000, "4K": 15000, "8K": 50000 },
        Type: { "LED": 0, "OLED": 25000, "QLED": 20000, "AMOLED": 30000 }
      }
    },

    // CLOTHING & APPAREL
    clothing: {
      men: {
        Size: { "XS": 0, "S": 0, "M": 0, "L": 0, "XL": 200, "XXL": 400, "3XL": 600 },
        Material: { "Cotton": 0, "Polyester": 100, "Linen": 300, "Blended": 150 },
        Fit: { "Regular": 0, "Slim": 200, "Relaxed": 100, "Oversized": 150 },
        Color: { "White": 0, "Black": 0, "Navy": 0, "Grey": 0, "Brown": 100, "Olive": 150 }
      },
      women: {
        Size: { "XS": 0, "S": 0, "M": 0, "L": 0, "XL": 200, "XXL": 400 },
        Style: { "Casual": 0, "Formal": 500, "Party": 1000, "Ethnic": 800 },
        Material: { "Cotton": 0, "Chiffon": 400, "Silk": 800, "Polyester": 100 },
        Color: { "White": 0, "Black": 0, "Red": 200, "Pink": 200, "Blue": 0, "Yellow": 150 }
      }
    },

    // FOOTWEAR
    footwear: {
      men: {
        "Size (UK)": { "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 200, "12": 400 },
        Color: { "Black": 0, "Brown": 0, "White": 100, "Tan": 150, "Navy": 100 },
        Type: { "Formal": 0, "Casual": 100, "Sports": 200, "Sandal": 300, "Slipper": 250 }
      },
      women: {
        "Size (UK)": { "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 200 },
        Heel: { "Flat": 0, "Low Heel": 300, "Mid Heel": 500, "High Heel": 800, "Wedge": 600 },
        Color: { "Black": 0, "White": 0, "Nude": 100, "Red": 300, "Pink": 250, "Gold": 400 }
      }
    },

    // FURNITURE & HOME
    furniture: {
      "living-room": {
        Size: { "2 Seater": 0, "3 Seater": 15000, "L Shape": 25000, "U Shape": 40000 },
        Material: { "Fabric": 0, "Leather": 20000, "Velvet": 15000, "Rexine": 5000 },
        Color: { "Beige": 0, "Grey": 0, "Brown": 1000, "Navy": 1500, "Green": 2000, "Cream": 500 }
      },
      bedroom: {
        Size: { "Single": 0, "Double": 10000, "Queen": 15000, "King": 25000, "Super King": 40000 },
        Material: { "Solid Wood": 0, "Engineered Wood": 5000, "Metal": 8000, "Upholstered": 12000 },
        "Color/Finish": { "Walnut": 0, "White": 2000, "Oak": 1500, "Grey": 1000, "Wenge": 3000 },
        Storage: { "Without Storage": 0, "With Storage": 5000, "Hydraulic": 8000, "Drawer": 6000 }
      },
      office: {
        Size: { "Small": 0, "Medium": 5000, "Large": 12000, "L Shape": 20000, "U Shape": 35000 },
        Material: { "MDF": 0, "Solid Wood": 8000, "Metal": 6000, "Glass Top": 10000 },
        Color: { "Black": 0, "White": 1000, "Walnut": 2000, "Grey": 1500, "Oak": 2500 }
      }
    },

    // JEWELRY
    jewelry: {
      rings: {
        "Ring Size": { "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 0, "12": 500, "Custom": 1000 },
        Metal: { "Gold 18K": 0, "Gold 22K": 5000, "Silver 925": 2000, "Rose Gold": 3000, "Platinum": 15000 },
        Stone: { "No Stone": 0, "Diamond": 10000, "Ruby": 8000, "Emerald": 7000, "Sapphire": 6000, "Pearl": 3000 }
      },
      necklaces: {
        Length: { "14 inch": 0, "16 inch": 500, "18 inch": 1000, "20 inch": 1500, "22 inch": 2000, "24 inch": 2500 },
        Metal: { "Gold": 0, "Silver": 2000, "Rose Gold": 3000, "Platinum": 12000, "Brass": 500 },
        Stone: { "No Stone": 0, "Diamond": 15000, "Pearl": 5000, "CZ": 2000, "Gemstone": 8000 }
      }
    },

    // COSMETICS & BEAUTY
    cosmetics: {
      skincare: {
        Size: { "15ml": 0, "30ml": 500, "50ml": 1000, "75ml": 1500, "100ml": 2000, "200ml": 3500 },
        "Skin Type": { "Oily": 0, "Dry": 0, "Normal": 0, "Combination": 0, "Sensitive": 500 },
        SPF: { "No SPF": 0, "SPF 15": 200, "SPF 30": 400, "SPF 50": 600, "SPF 50+": 800 }
      },
      makeup: {
        Shade: { "Fair": 0, "Light": 0, "Medium": 0, "Tan": 0, "Deep": 0, "Rich": 200 },
        Finish: { "Matte": 0, "Dewy": 100, "Satin": 150, "Glossy": 120, "Natural": 80 },
        Size: { "Mini": 0, "Regular": 300, "Full Size": 600, "Value Pack": 1000 }
      }
    },

    // SPORTS & FITNESS
    sports: {
      gym: {
        Weight: { "1kg": 0, "2kg": 200, "5kg": 500, "10kg": 1000, "15kg": 1500, "20kg": 2000, "25kg": 2500 },
        Material: { "Cast Iron": 0, "Rubber Coated": 500, "Chrome": 800, "Neoprene": 600 },
        Set: { "Single": 0, "Pair": 300, "Set of 3": 800, "Full Set": 2000 }
      },
      yoga: {
        Size: { "Standard": 0, "Large": 500, "Extra Large": 1000 },
        Thickness: { "3mm": 0, "4mm": 300, "6mm": 600, "8mm": 1000, "10mm": 1500 },
        Color: { "Blue": 0, "Purple": 100, "Green": 100, "Black": 0, "Pink": 150, "Orange": 120 }
      }
    }
  },

  // ─── FURNITURE & HOME ──────────────────────────────
  furniture: {
    default: [
      { name: "Size", values: ["Small","Medium","Large","XL","Custom"] },
      { name: "Color/Finish", values: ["Walnut","Oak","White","Black","Natural Wood"] },
      { name: "Material", values: ["Solid Wood","Plywood","MDF","Metal","Rattan"] }
    ],
    "living-room": [
      { name: "Size", values: ["2 Seater","3 Seater","L Shape","U Shape"] },
      { name: "Color", values: ["Beige","Grey","Brown","Navy","Green","Cream"] },
      { name: "Material", values: ["Fabric","Leather","Velvet","Rexine"] }
    ],
    bedroom: [
      { name: "Size", values: ["Single","Double","Queen","King","Super King"] },
      { name: "Color/Finish", values: ["Walnut","White","Oak","Grey","Wenge"] },
      { name: "Material", values: ["Solid Wood","Engineered Wood","Metal","Upholstered"] },
      { name: "Storage", values: ["Without Storage","With Storage","Hydraulic","Drawer"] }
    ],
    office: [
      { name: "Size", values: ["Small","Medium","Large","L Shape","U Shape"] },
      { name: "Color", values: ["Black","White","Walnut","Grey","Oak"] },
      { name: "Material", values: ["MDF","Solid Wood","Metal","Glass Top"] }
    ]
  },

  // ─── COSMETICS & BEAUTY ────────────────────────────
  cosmetics: {
    default: [
      { name: "Size", values: ["30ml","50ml","100ml","200ml"] },
      { name: "Type", values: ["Regular","Organic","Herbal","Medicated"] },
      { name: "Skin Type", values: ["Oily","Dry","Normal","All Types"] }
    ],
    skincare: [
      { name: "Size", values: ["15ml","30ml","50ml","75ml","100ml","200ml"] },
      { name: "Skin Type", values: ["Oily","Dry","Normal","Combination","Sensitive"] },
      { name: "SPF", values: ["No SPF","SPF 15","SPF 30","SPF 50","SPF 50+"] }
    ],
    makeup: [
      { name: "Shade", values: ["Fair","Light","Medium","Tan","Deep","Rich"] },
      { name: "Finish", values: ["Matte","Dewy","Satin","Glossy","Natural"] },
      { name: "Size", values: ["Mini","Regular","Full Size","Value Pack"] }
    ],
    haircare: [
      { name: "Size", values: ["100ml","200ml","400ml","500ml","1L"] },
      { name: "Hair Type", values: ["Oily","Dry","Normal","Damaged","Curly","Color Treated"] },
      { name: "Type", values: ["Regular","Organic","Anti-Dandruff","Keratin","Volumizing"] }
    ],
    fragrances: [
      { name: "Size", values: ["30ml","50ml","75ml","100ml","150ml","200ml"] },
      { name: "Type", values: ["EDP","EDT","Perfume","Body Mist","Deodorant"] },
      { name: "Gender", values: ["Men","Women","Unisex"] }
    ]
  },

  // ─── HARDWARE & TOOLS ──────────────────────────────
  hardware: {
    default: [
      { name: "Size", values: ["Small","Medium","Large","XL"] },
      { name: "Material", values: ["Steel","Aluminium","Plastic","Iron","Brass"] },
      { name: "Grade", values: ["Standard","Professional","Industrial"] }
    ],
    "hand-tools": [
      { name: "Size", values: ["Small","Medium","Large","Heavy Duty"] },
      { name: "Material", values: ["Chrome Vanadium","Carbon Steel","HSS","Alloy Steel"] },
      { name: "Set", values: ["Single","Set of 5","Set of 10","Complete Set"] }
    ],
    "power-tools": [
      { name: "Voltage", values: ["12V","18V","20V","110V","220V"] },
      { name: "Grade", values: ["DIY","Professional","Industrial"] },
      { name: "Color", values: ["Black","Yellow","Blue","Red","Green"] }
    ],
    paints: [
      { name: "Volume", values: ["1L","4L","10L","20L"] },
      { name: "Finish", values: ["Matte","Satin","Semi-Gloss","Gloss","Enamel"] },
      { name: "Type", values: ["Interior","Exterior","Waterproof","Heat Resistant"] }
    ]
  },

  // ─── SPORTS & FITNESS ──────────────────────────────
  sports: {
    default: [
      { name: "Size", values: ["Small","Medium","Large","XL"] },
      { name: "Color", values: ["Black","Blue","Red","Green","White"] },
      { name: "Grade", values: ["Beginner","Intermediate","Professional"] }
    ],
    cricket: [
      { name: "Size", values: ["Size 3","Size 4","Size 5","Size 6","Full Size"] },
      { name: "Grade", values: ["Tennis Ball","Leather","Club","International"] },
      { name: "Color", values: ["Red","White","Pink","Yellow"] }
    ],
    gym: [
      { name: "Weight", values: ["1kg","2kg","5kg","10kg","15kg","20kg","25kg"] },
      { name: "Material", values: ["Cast Iron","Rubber Coated","Chrome","Neoprene"] },
      { name: "Set", values: ["Single","Pair","Set of 3","Full Set"] }
    ],
    yoga: [
      { name: "Size", values: ["Standard","Large","Extra Large"] },
      { name: "Thickness", values: ["3mm","4mm","6mm","8mm","10mm"] },
      { name: "Color", values: ["Blue","Purple","Green","Black","Pink","Orange"] }
    ],
    cycling: [
      { name: "Size", values: ["XS","S","M","L","XL"] },
      { name: "Color", values: ["Black","White","Red","Blue","Yellow","Green"] },
      { name: "Type", values: ["Road","Mountain","Hybrid","BMX","Electric"] }
    ],
    badminton: [
      { name: "Weight", values: ["Feather","Nylon 75","Nylon 76","Nylon 77","Nylon 78"] },
      { name: "Speed", values: ["Slow","Medium","Fast"] },
      { name: "Pack", values: ["Single","Pack of 3","Pack of 6","Pack of 12"] }
    ]
  },

  // ─── TOYS & KIDS ───────────────────────────────────
  toys: {
    default: [
      { name: "Age Group", values: ["0-2yr","2-4yr","4-6yr","6-8yr","8-12yr","12+yr"] },
      { name: "Color", values: ["Red","Blue","Yellow","Green","Pink","Multicolor"] },
      { name: "Size", values: ["Small","Medium","Large"] }
    ],
    educational: [
      { name: "Age Group", values: ["2-4yr","4-6yr","6-8yr","8-12yr"] },
      { name: "Subject", values: ["Math","Science","Language","Art","Coding","General"] },
      { name: "Pack", values: ["Single","Set","Bundle","Complete Kit"] }
    ],
    "outdoor-toys": [
      { name: "Age Group", values: ["3-5yr","5-8yr","8-12yr","12+yr"] },
      { name: "Color", values: ["Red","Blue","Yellow","Green","Multicolor"] },
      { name: "Size", values: ["Small","Medium","Large","XL"] }
    ]
  },

  // ─── PACKAGING & CONTAINERS ───────────────────────
  packaging: {
    default: [
      { name: "Capacity", values: ["200ml","300ml","400ml","500ml","600ml","800ml","1L"] },
      { name: "Material", values: ["Stainless Steel","Plastic","Glass","Bamboo"] },
      { name: "Color", values: ["Silver","Black","White","Red","Blue","Green","Orange"] }
    ],
    "lunch box": [
      { name: "Capacity", values: ["200ml","300ml","400ml","500ml","600ml","800ml","1L","1.2L"] },
      { name: "Compartments", values: ["1-Compartment","2-Compartment","3-Compartment","4-Compartment"] },
      { name: "Material", values: ["Stainless Steel","Plastic","Glass"] },
      { name: "Color", values: ["Silver","Black","White","Red","Blue","Green"] }
    ],
    "tiffin box": [
      { name: "Capacity", values: ["200ml","300ml","500ml","750ml","1L"] },
      { name: "Compartments", values: ["1-Compartment","2-Compartment","3-Compartment"] },
      { name: "Type", values: ["Traditional","Modern","Bento Style"] },
      { name: "Color", values: ["Silver","White","Black","Copper"] }
    ],
    "storage containers": [
      { name: "Capacity", values: ["500ml","1L","2L","3L","5L","10L"] },
      { name: "Material", values: ["Plastic","Glass","Stainless Steel","Metal"] },
      { name: "Type", values: ["Airtight","Stackable","Freezer Safe","Microwave Safe"] }
    ],
    "bottles & cups": [
      { name: "Capacity", values: ["250ml","350ml","500ml","750ml","1L"] },
      { name: "Material", values: ["Stainless Steel","Plastic","Glass","Ceramic"] },
      { name: "Type", values: ["Water Bottle","Coffee Mug","Travel Mug","Tumbler"] },
      { name: "Color", values: ["Black","White","Blue","Red","Green","Silver"] }
    ]
  },

  // ─── JEWELRY ───────────────────────────────────────
  jewelry: {
    default: [
      { name: "Size", values: ["XS","S","M","L","Free Size"] },
      { name: "Metal", values: ["Gold","Silver","Rose Gold","Platinum","Brass"] },
      { name: "Stone", values: ["No Stone","Diamond","Ruby","Emerald","Pearl","CZ"] }
    ],
    rings: [
      { name: "Ring Size", values: ["5","6","7","8","9","10","11","12","Custom"] },
      { name: "Metal", values: ["Gold 18K","Gold 22K","Silver 925","Rose Gold","Platinum"] },
      { name: "Stone", values: ["No Stone","Diamond","Ruby","Emerald","Sapphire","Pearl"] }
    ],
    necklaces: [
      { name: "Length", values: ["14 inch","16 inch","18 inch","20 inch","22 inch","24 inch"] },
      { name: "Metal", values: ["Gold","Silver","Rose Gold","Platinum","Brass"] },
      { name: "Stone", values: ["No Stone","Diamond","Pearl","CZ","Gemstone"] }
    ],
    earrings: [
      { name: "Style", values: ["Stud","Hoop","Drop","Chandelier","Huggie","Cuff"] },
      { name: "Metal", values: ["Gold","Silver","Rose Gold","Platinum"] },
      { name: "Stone", values: ["No Stone","Diamond","Pearl","CZ","Gemstone"] }
    ]
  }
};

const productSchema = new mongoose.Schema(
  {
    // --- Basic Info ---
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    // --- Pricing ---
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    priceMax: {
      type: Number,
      min: [0, "Price max cannot be negative"],
    },
    comparePrice: {
      type: Number,
      min: [0, "Compare price cannot be negative"],
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR"],
    },
    priceUnit: {
      type: String,
      default: "Piece",
      enum: ["Piece", "Kg", "Meter", "Liter", "Box", "Packet", "Ton", "Set"],
    },

    // --- Tiered Pricing (Volume Discounts) ---
    pricingSlabs: [
      {
        minQty: { type: Number, required: true }, // Minimum quantity
        maxQty: { type: Number }, // Maximum quantity (null = unlimited)
        price: { type: Number, required: true }, // Price for this quantity range
      },
    ],

    // --- Category ---
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    // --- Images ---
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String }, // Cloudinary public ID for deletion
        alt: { type: String }, // Alt text for accessibility
        type: { type: String, enum: ['image', 'video'], default: 'image' }, // image or video
        videoThumbnail: { type: String }, // Thumbnail URL for video
      },
    ],

    // --- Seller ---
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller is required"],
    },
    companyName: { type: String },

    // --- Product Details ---
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    specifications: [
      {
        key: { type: String, required: true }, // e.g. "Weight", "Color"
        value: { type: String, required: true }, // e.g. "5kg", "Red"
      },
    ],
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: [1, "Minimum order quantity must be at least 1"],
    },
    maxOrderQuantity: {
      type: Number,
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },

    // --- Stock Availability Status ---
    stockStatus: {
      type: String,
      enum: ["in_stock", "out_of_stock", "made_to_order"],
      default: "in_stock",
    },
    leadTime: { type: String, default: "1-2 days" }, // For made-to-order products

    // --- Product Catalogue (PDF) ---
    cataloguePdf: {
      url: { type: String }, // PDF URL
      fileName: { type: String }, // Original file name
      uploadedAt: { type: Date }, // When uploaded
    },

    // --- 360° View & Videos ---
    view360Images: [
      {
        url: { type: String, required: true },
        angle: { type: Number }, // 0-360 degrees
      },
    ],

    // --- Location ---
    city: { type: String, trim: true },
    state: { type: String, trim: true },

    // --- Stats ---
    views: { type: Number, default: 0 },
    inquiryCount: { type: Number, default: 0 },

    // --- Ratings ---
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },

    // --- Sample Settings ---
    allowSamples: { type: Boolean, default: false },
    samplePrice: { type: Number, default: 0, min: 0 },
    sampleMinQty: { type: Number, default: 1, min: 1 },
    sampleMaxQty: { type: Number, default: 5, min: 1 },
    sampleLeadTime: { type: String, default: "3-5 days" },

    // --- Status & Flags ---
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    featuredUntil: { type: Date }, // When featured listing expires
    isVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "approved",
    },
    rejectionReason: { type: String },

    // --- Approval History ---
    approvalHistory: [
      {
        action: {
          type: String,
          enum: ["approved", "rejected", "pending"],
        },
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        adminName: { type: String },
        date: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],

    // --- Variants Support ---
    hasVariants: { type: Boolean, default: false },
    variantSource: {
      type: String,
      enum: ["auto", "manual", "hybrid"],
      default: "auto",
    },
    variants: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        sku: { type: String, unique: true, sparse: true },
        name: { type: String },
        attributeValues: {
          type: Map,
          of: String,
        },
        images: [{ type: String }],
        thumbnail: { type: String },
        price: { type: Number, required: true },
        originalPrice: { type: Number },
        stock: { type: Number, default: 0 },
        moq: { type: Number, default: 1 },
        specifications: [
          {
            label: { type: String },
            value: { type: String },
          },
        ],
        available: { type: Boolean, default: true },
        badge: { type: String },
        status: {
          type: String,
          enum: ["active", "inactive", "out_of_stock"],
          default: "active",
        },
        source: {
          type: String,
          enum: ["auto", "manual"],
          default: "auto",
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    variantTypes: [
      {
        name: { type: String },
        type: {
          type: String,
          enum: ["swatch", "button", "dropdown"],
        },
        values: [
          {
            label: { type: String },
            value: { type: String },
            hex: { type: String },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ========================================
// INDEXES — For fast queries
// ========================================

// Text index for full-text search
productSchema.index({
  name: "text",
  description: "text",
  tags: "text",
});

// slug already indexed via unique: true

// Compound indexes for filtered queries
productSchema.index({ category: 1, price: 1 });
productSchema.index({ category: 1, city: 1 });
productSchema.index({ seller: 1, isActive: 1 });

// Variant-related indexes
productSchema.index({ "variants.sku": 1 });
productSchema.index({ "variants.status": 1 });
productSchema.index({ variantSource: 1 });

// Single field indexes
productSchema.index({ averageRating: -1 });
productSchema.index({ views: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ city: 1 });
productSchema.index({ isFeatured: -1, featuredUntil: 1 });
productSchema.index({ featuredUntil: 1 });

// ╔═════════════════════════════════════════════════════════════════╗
// ║          HELPER FUNCTIONS — Variant Generation                 ║
// ╚═════════════════════════════════════════════════════════════════╝

/**
 * Generate all possible variant combinations using Cartesian product
 * @param {Array} variantTypes - Array of variant type objects with name and values
 * @param {String} skuPrefix - Prefix for SKU generation
 * @param {Number} basePrice - Base price for all variants
 * @param {Number} baseStock - Stock to distribute among variants
 * @returns {Array} Array of variant combinations
 */
function generateVariantCombinations(variantTypes, skuPrefix = "", basePrice = 0, baseStock = 0) {
  if (!variantTypes || variantTypes.length === 0) return [];

  const combinations = [];
  let combos = [{}];

  // Generate Cartesian product
  for (const vt of variantTypes) {
    const newCombos = [];
    for (const existing of combos) {
      for (const value of vt.values) {
        newCombos.push({ ...existing, [vt.name]: value });
      }
    }
    combos = newCombos;
  }

  // Calculate stock per variant
  const totalCombos = combos.length;
  const stockPerVariant = totalCombos > 0 ? Math.floor(baseStock / totalCombos) : 0;

  // Convert to variant objects with SKU
  combos.forEach((attrs, index) => {
    const attrPart = Object.values(attrs)
      .map(v => v.substring(0, 3).toUpperCase().replace(/\s/g, ""))
      .join("-");

    const sku = skuPrefix
      ? `${skuPrefix}-${attrPart}-${String(index + 1).padStart(3, "0")}`
      : `${attrPart}-${String(index + 1).padStart(3, "0")}`;

    combinations.push({
      sku,
      name: Object.values(attrs).join(" - "),
      attributeValues: new Map(Object.entries(attrs)),
      images: [],
      thumbnail: "",
      price: basePrice,
      originalPrice: basePrice,
      stock: stockPerVariant,
      moq: 1,
      specifications: [],
      available: stockPerVariant > 0,
    });
  });

  return combinations;
}

/**
 * Calculate price for a variant using additive attribute pricing
 * @param {Number} basePrice - Base price
 * @param {Object} attributeValues - Variant's attribute values {RAM: "16GB", Storage: "512GB SSD", Color: "Gold"}
 * @param {Object} attributePricingMap - Pricing map {RAM: {4GB: 0, 8GB: 15000}, Storage: {...}, ...}
 * @returns {Number} Calculated price
 */
function calculateAttributeBasedPrice(basePrice, attributeValues, attributePricingMap) {
  let totalPrice = basePrice;

  for (const [attrName, attrValue] of Object.entries(attributeValues)) {
    const pricingForAttr = attributePricingMap[attrName];
    if (pricingForAttr && pricingForAttr[attrValue]) {
      totalPrice += pricingForAttr[attrValue];
    }
  }

  return Math.max(basePrice, totalPrice); // Price should never go below base price
}

/**
 * Generate variants with attribute-based pricing
 * @param {Array} variantTypes - Variant type definitions
 * @param {String} skuPrefix - SKU prefix
 * @param {Number} basePrice - Base price
 * @param {Number} baseStock - Base stock
 * @param {Object} attributePricingMap - Attribute pricing configuration
 * @returns {Array} Variants with calculated prices
 */
function generateVariantCombinationsWithPricing(variantTypes, skuPrefix, basePrice, baseStock, attributePricingMap = {}) {
  if (!variantTypes || variantTypes.length === 0) return [];

  const combinations = [];
  let combos = [{}];

  // Generate Cartesian product
  for (const vt of variantTypes) {
    const newCombos = [];
    for (const existing of combos) {
      for (const value of vt.values) {
        newCombos.push({ ...existing, [vt.name]: value });
      }
    }
    combos = newCombos;
  }

  // Calculate stock per variant
  const totalCombos = combos.length;
  const stockPerVariant = totalCombos > 0 ? Math.floor(baseStock / totalCombos) : 0;

  // Convert to variant objects with SKU and calculated price
  combos.forEach((attrs, index) => {
    const attrPart = Object.values(attrs)
      .map(v => v.substring(0, 3).toUpperCase().replace(/\s/g, ""))
      .join("-");

    const sku = skuPrefix
      ? `${skuPrefix}-${attrPart}-${String(index + 1).padStart(3, "0")}`
      : `${attrPart}-${String(index + 1).padStart(3, "0")}`;

    // Calculate price with attribute-based pricing
    const calculatedPrice = attributePricingMap && Object.keys(attributePricingMap).length > 0
      ? calculateAttributeBasedPrice(basePrice, attrs, attributePricingMap)
      : basePrice;

    combinations.push({
      sku,
      name: Object.values(attrs).join(" - "),
      attributeValues: new Map(Object.entries(attrs)),
      images: [],
      thumbnail: "",
      price: calculatedPrice,
      originalPrice: basePrice,
      stock: stockPerVariant,
      moq: 1,
      specifications: [],
      available: stockPerVariant > 0,
    });
  });

  return combinations;
}

// ========================================
// HOOKS
// ========================================

// Auto-generate variants and slug
productSchema.pre("save", function () {
  // ─── Auto-generate slug from name ───
  if (this.isModified("name")) {
    const timestamp = Date.now().toString(36);
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .substring(0, 80) +
      "-" +
      timestamp;
  }

  // ─── Auto-generate variants from category if empty ───
  // This is a placeholder - actual auto-generation happens in controller after populating category
  if ((!this.variantTypes || this.variantTypes.length === 0) && this.category) {
    try {
      // Try to extract from populated category object if available
      const categoryObj = this.category;
      const subCategoryObj = this.subCategory;

      console.log("🔄 [AutoVariant Hook] Checking category...");
      console.log("   categoryObj type:", typeof categoryObj);
      console.log("   categoryObj.slug:", categoryObj?.slug);
      console.log("   categoryObj.name:", categoryObj?.name);
      console.log("   subCategoryObj.slug:", subCategoryObj?.slug);
      console.log("   subCategoryObj.name:", subCategoryObj?.name);

      // Only process if category is populated (object, not ObjectId)
      if (categoryObj && typeof categoryObj === "object" && categoryObj.slug) {
        // Extract category name from slug - try full slug first, then first word
        let categoryName = categoryObj.slug?.toLowerCase() || categoryObj.name?.toLowerCase() || "default";

        // Also try first word of slug
        let categoryNameFirstWord = categoryObj.slug?.split("-")[0]?.toLowerCase() || "default";

        console.log("   categoryName (full slug):", categoryName);
        console.log("   categoryNameFirstWord:", categoryNameFirstWord);

        // Extract subcategory name
        let subCategoryName = "default";
        if (subCategoryObj && typeof subCategoryObj === "object" && subCategoryObj.slug) {
          subCategoryName = subCategoryObj.slug.toLowerCase();
        }

        console.log("   subCategoryName:", subCategoryName);

        // Get variant templates from AUTO_VARIANTS mapping
        // Try multiple variations of category name
        let catMap = AUTO_VARIANTS[categoryName];

        if (!catMap) {
          catMap = AUTO_VARIANTS[categoryNameFirstWord];
        }

        if (!catMap) {
          // Try replacing hyphens with spaces
          const categoryNameWithSpaces = categoryName.replace(/-/g, " ");
          catMap = AUTO_VARIANTS[categoryNameWithSpaces];
        }

        console.log("   AUTO_VARIANTS keys:", Object.keys(AUTO_VARIANTS));
        console.log("   catMap found:", !!catMap);

        // Use found catMap or fallback to default variants
        let templates;
        if (catMap) {
          templates = catMap[subCategoryName] || catMap["default"];
        } else {
          // FALLBACK: Generate default variants for ANY category
          console.log("   ⚠️ Category not in AUTO_VARIANTS, using fallback defaults");
          templates = [
            { name: "Size", values: ["Small","Medium","Large","XL"] },
            { name: "Color", values: ["White","Black","Navy","Grey","Red","Blue"] },
            { name: "Variant", values: ["Standard","Premium","Deluxe"] }
          ];
        }

        if (templates && templates.length > 0) {
            // Transform templates to variantTypes format
            this.variantTypes = templates.map(template => ({
              name: template.name,
              type: "dropdown",
              values: template.values.map(value => ({
                label: value,
                value: value.toLowerCase().replace(/\s+/g, "-")
              }))
            }));

            // Generate variant combinations
            const skuPrefix = this.name?.substring(0, 3).toUpperCase().replace(/\s/g, "") || "SKU";
            this.variants = generateVariantCombinations(
              templates,
              skuPrefix,
              this.price || 0,
              this.stock || 0
            );

            // Set hasVariants flag
            this.hasVariants = this.variants.length > 0;

            console.log(`✅ [Auto-Variants] Generated ${this.variants.length} variants for "${this.name}"`);
            console.log(`   Category: ${categoryName}, SubCategory: ${subCategoryName}`);
            console.log(`   Variant Types: ${this.variantTypes.map(vt => vt.name).join(", ")}`);
          }
        }
    } catch (error) {
      console.error("[Auto-Variants] Error auto-generating variants:", error.message);
      // Don't throw - continue without auto-generation
    }
  }
});

// ========================================
// VIRTUALS
// ========================================

// Calculate discount percentage
productSchema.virtual("discountPercent").get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

productSchema.set("toObject", { virtuals: true });
productSchema.set("toJSON", { virtuals: true });

const Product = mongoose.model("Product", productSchema);

export default Product;
export { generateVariantCombinations, generateVariantCombinationsWithPricing, calculateAttributeBasedPrice, AUTO_VARIANTS, attributePricing: AUTO_VARIANTS.attributePricing };
