import { db } from "./db";
import { products } from "@shared/schema";

const seedProducts = [
  {
    name: "Coral Animal Print T-Shirt",
    description: "Comfortable coral colored cotton t-shirt with playful animal prints perfect for active toddlers",
    price: "899.00",
    originalPrice: "1299.00",
    category: "T-Shirts",
    ageGroup: "3-5 Years",
    sizes: ["XS", "S", "M", "L"],
    images: ["attached_assets/generated_images/Kids_coral_t-shirt_product_a3912b82.png"],
    inStock: true,
    isNew: true,
    discount: 31
  },
  {
    name: "Mint Green Floral Dress",
    description: "Beautiful flowing mint green dress with delicate floral embroidery, perfect for special occasions",
    price: "1599.00",
    category: "Dresses",
    ageGroup: "6-8 Years",
    sizes: ["S", "M", "L", "XL"],
    images: ["attached_assets/generated_images/Kids_mint_dress_product_59394fee.png"],
    inStock: true,
    isNew: false
  },
  {
    name: "Sunny Yellow Cotton Shorts",
    description: "Bright and cheerful yellow cotton shorts with elastic waistband for maximum comfort",
    price: "699.00",
    originalPrice: "999.00",
    category: "Shorts",
    ageGroup: "2-4 Years",
    sizes: ["XS", "S", "M"],
    images: ["attached_assets/generated_images/Kids_yellow_shorts_product_6ad599f2.png"],
    inStock: true,
    isNew: false,
    discount: 30
  },
  {
    name: "Rainbow Striped Top",
    description: "Colorful rainbow striped cotton top that brings joy to any outfit",
    price: "799.00",
    category: "T-Shirts",
    ageGroup: "0-2 Years",
    sizes: ["XS", "S"],
    images: ["attached_assets/generated_images/Kids_coral_t-shirt_product_a3912b82.png"],
    inStock: false
  },
  {
    name: "Ocean Blue Jumpsuit",
    description: "Stylish ocean blue jumpsuit perfect for playtime and casual outings",
    price: "1299.00",
    originalPrice: "1699.00",
    category: "Jumpsuits",
    ageGroup: "3-5 Years",
    sizes: ["XS", "S", "M"],
    images: ["attached_assets/generated_images/Kids_mint_dress_product_59394fee.png"],
    inStock: true,
    isNew: true,
    discount: 24
  },
  {
    name: "Pink Polka Dot Skirt",
    description: "Adorable pink skirt with white polka dots, perfect for school or play",
    price: "899.00",
    category: "Skirts",
    ageGroup: "6-8 Years",
    sizes: ["S", "M", "L"],
    images: ["attached_assets/generated_images/Kids_yellow_shorts_product_6ad599f2.png"],
    inStock: true
  }
];

async function seedDatabase() {
  try {
    console.log("🌱 Seeding database with sample products...");
    
    // Check if products already exist
    const existingProducts = await db.select().from(products);
    if (existingProducts.length > 0) {
      console.log("📦 Products already exist, skipping seed");
      return;
    }

    // Insert seed products
    await db.insert(products).values(seedProducts);
    
    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

export { seedDatabase };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => process.exit(0));
}