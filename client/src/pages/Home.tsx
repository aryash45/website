import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import ShoppingCart, { type CartItem } from "@/components/ShoppingCart";
import { type Product } from "@/components/ProductCard";
import coralShirtImage from '@assets/generated_images/Kids_coral_t-shirt_product_a3912b82.png';
import mintDressImage from '@assets/generated_images/Kids_mint_dress_product_59394fee.png';
import yellowShortsImage from '@assets/generated_images/Kids_yellow_shorts_product_6ad599f2.png';

// todo: remove mock functionality
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Coral Animal Print T-Shirt",
    price: 899,
    originalPrice: 1299,
    image: coralShirtImage,
    category: "T-Shirts",
    ageGroup: "3-5 Years",
    sizes: ["XS", "S", "M", "L"],
    inStock: true,
    isNew: true,
    discount: 31
  },
  {
    id: "2",
    name: "Mint Green Floral Dress",
    price: 1599,
    image: mintDressImage,
    category: "Dresses",
    ageGroup: "6-8 Years",
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    isNew: false
  },
  {
    id: "3",
    name: "Sunny Yellow Cotton Shorts",
    price: 699,
    originalPrice: 999,
    image: yellowShortsImage,
    category: "Shorts",
    ageGroup: "2-4 Years",
    sizes: ["XS", "S", "M"],
    inStock: true,
    isNew: false,
    discount: 30
  },
  {
    id: "4",
    name: "Rainbow Striped Top",
    price: 799,
    image: coralShirtImage,
    category: "T-Shirts",
    ageGroup: "0-2 Years",
    sizes: ["XS", "S"],
    inStock: false
  },
  {
    id: "5",
    name: "Ocean Blue Jumpsuit",
    price: 1299,
    originalPrice: 1699,
    image: mintDressImage,
    category: "Jumpsuits",
    ageGroup: "3-5 Years",
    sizes: ["XS", "S", "M"],
    inStock: true,
    isNew: true,
    discount: 24
  },
  {
    id: "6",
    name: "Pink Polka Dot Skirt",
    price: 899,
    image: yellowShortsImage,
    category: "Skirts",
    ageGroup: "6-8 Years",
    sizes: ["S", "M", "L"],
    inStock: true
  }
];

const mockCategories = [
  {
    id: "0-2",
    name: "Tiny Tots",
    ageRange: "0-2 Years",
    description: "Soft, comfortable clothes for babies and toddlers",
    itemCount: 45,
    image: coralShirtImage,
    color: "#FF6B6B"
  },
  {
    id: "3-5",
    name: "Little Explorers",
    ageRange: "3-5 Years",
    description: "Durable playwear for active preschoolers",
    itemCount: 68,
    image: mintDressImage,
    color: "#4ECDC4"
  },
  {
    id: "6-8",
    name: "Young Adventurers",
    ageRange: "6-8 Years",
    description: "Stylish outfits for school and play",
    itemCount: 52,
    image: yellowShortsImage,
    color: "#FFE66D"
  },
  {
    id: "9-12",
    name: "Big Kids",
    ageRange: "9-12 Years",
    description: "Trendy fashion for tweens and pre-teens",
    itemCount: 39,
    image: coralShirtImage,
    color: "#27AE60"
  }
];

export default function Home() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState(mockProducts);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const handleSearchChange = (query: string) => {
    console.log("Search query:", query);
    if (!query.trim()) {
      setFilteredProducts(mockProducts);
      return;
    }

    const filtered = mockProducts.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase()) ||
      product.ageGroup.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleAddToCart = (productId: string, size: string) => {
    const product = mockProducts.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cartItems.find(item => 
      item.productId === productId && item.size === size
    );

    if (existingItem) {
      setCartItems(prev => prev.map(item =>
        item.id === existingItem.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${productId}-${size}`,
        productId,
        name: product.name,
        price: product.price,
        size,
        quantity: 1,
        image: product.image,
        ageGroup: product.ageGroup
      };
      setCartItems(prev => [...prev, newItem]);
    }
    
    // Show cart briefly after adding item
    setIsCartOpen(true);
    setTimeout(() => setIsCartOpen(false), 2000);
  };

  const handleToggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  const handleUpdateCartQuantity = (itemId: string, quantity: number) => {
    setCartItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleCheckout = () => {
    console.log("Proceeding to checkout with items:", cartItems);
    alert("Checkout functionality will be implemented in the full application!");
  };

  const handleCategoryClick = (categoryId: string) => {
    console.log(`Navigating to category: ${categoryId}`);
    // Filter products by category
    const categoryProducts = mockProducts.filter(product => {
      const ageRange = categoryId.replace('-', '-');
      return product.ageGroup.includes(ageRange);
    });
    setFilteredProducts(categoryProducts);
  };

  const handleShopNow = () => {
    // Scroll to products section
    const productsSection = document.getElementById('products-section');
    productsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-home">
      {/* Header */}
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onSearchChange={handleSearchChange}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Hero Section */}
      <HeroSection onShopNowClick={handleShopNow} />

      {/* Categories Section */}
      <CategorySection
        categories={mockCategories}
        onCategoryClick={handleCategoryClick}
      />

      {/* Featured Products Section */}
      <section id="products-section" className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-4" data-testid="text-featured-title">
              Featured Collection
            </h2>
            <p className="text-lg text-muted-foreground font-open-sans max-w-2xl mx-auto">
              Discover our most loved pieces that combine comfort, style, and quality for your little ones
            </p>
          </div>

          <ProductGrid
            products={filteredProducts}
            loading={false}
            hasMore={true}
            onLoadMore={() => console.log("Load more products")}
            onAddToCart={handleAddToCart}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
          />
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Shopping Cart */}
      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleCheckout}
      />
    </div>
  );
}