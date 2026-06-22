import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import ShoppingCart, { type CartItem } from "@/components/ShoppingCart";
import CheckoutDialog from "@/components/CheckoutDialog";
import { useProducts, useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem } from "@/lib/products";
import coralShirtImage from '@assets/generated_images/Kids_coral_t-shirt_product_a3912b82.png';
import mintDressImage from '@assets/generated_images/Kids_mint_dress_product_59394fee.png';
import yellowShortsImage from '@assets/generated_images/Kids_yellow_shorts_product_6ad599f2.png';
import tinyTotsIcon from '@assets/generated_images/category_tiny_tots.png';
import littleExplorersIcon from '@assets/generated_images/category_little_explorers.png';
import youngAdventurersIcon from '@assets/generated_images/category_young_adventurers.png';

const mockCategories = [
  {
    id: "0-2",
    name: "Tiny Tots",
    ageRange: "0-2 Years",
    description: "Soft, comfortable clothes for babies and toddlers",
    itemCount: 45,
    image: tinyTotsIcon,
    color: "#FF6B6B"
  },
  {
    id: "3-5",
    name: "Little Explorers",
    ageRange: "3-5 Years",
    description: "Durable playwear for active preschoolers",
    itemCount: 68,
    image: littleExplorersIcon,
    color: "#4ECDC4"
  },
  {
    id: "6-8",
    name: "Young Adventurers",
    ageRange: "6-8 Years",
    description: "Stylish outfits for school and play",
    itemCount: 52,
    image: youngAdventurersIcon,
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
  const { data: dbProducts = [], isLoading } = useProducts();
  const { data: cartData } = useCart();
  const addToCartMutation = useAddToCart();
  const updateCartQuantityMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();

  const [_, setLocation] = useLocation();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => {
    return new URLSearchParams(window.location.search).get("search") || "";
  });
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get("search") || "");
  }, [window.location.search]);

  // Map API cart response to the frontend representation
  const cartItems: CartItem[] = (cartData?.items || []).map((item: any) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    price: parseFloat(item.product.price),
    size: item.size,
    quantity: item.quantity,
    image: item.product.images[0] || '',
    ageGroup: item.product.ageGroup
  }));

  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartShipping = cartSubtotal >= 999 ? 0 : 99;
  const cartTotal = cartSubtotal + cartShipping;

  const filteredProducts = dbProducts.filter(product => {
    if (selectedAgeGroup) {
      const ageRange = selectedAgeGroup.replace('-', '-');
      if (!product.ageGroup.includes(ageRange)) return false;
    }

    if (!searchQuery.trim()) return true;
    return (
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.ageGroup.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const url = query.trim() ? `/?search=${encodeURIComponent(query)}` : "/";
    window.history.replaceState(null, "", url);
  };

  const handleAddToCart = (productId: string, size: string) => {
    addToCartMutation.mutate({ productId, size, quantity: 1 });
    
    // Show cart briefly after adding item
    setIsCartOpen(true);
    setTimeout(() => setIsCartOpen(false), 2000);
  };



  const handleUpdateCartQuantity = (itemId: string, quantity: number) => {
    updateCartQuantityMutation.mutate({ id: itemId, quantity });
  };

  const handleRemoveCartItem = (itemId: string) => {
    removeCartItemMutation.mutate(itemId);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleCategoryClick = (categoryId: string) => {
    setLocation(`/category/${categoryId}`);
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

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <span className="text-muted-foreground font-medium animate-pulse">Loading products...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found. Please seed the database or check back later.</p>
            </div>
          ) : (
            <ProductGrid
              products={filteredProducts}
              loading={false}
              hasMore={false}
              onAddToCart={handleAddToCart}
            />
          )}
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

      {/* Checkout Dialog */}
      <CheckoutDialog
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        subtotal={cartSubtotal}
        shipping={cartShipping}
        total={cartTotal}
      />
    </div>
  );
}