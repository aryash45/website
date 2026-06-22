import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import ShoppingCart, { type CartItem } from "@/components/ShoppingCart";
import CheckoutDialog from "@/components/CheckoutDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import coralShirtImage from '@assets/generated_images/Kids_coral_t-shirt_product_a3912b82.png';
import mintDressImage from '@assets/generated_images/Kids_mint_dress_product_59394fee.png';
import yellowShortsImage from '@assets/generated_images/Kids_yellow_shorts_product_6ad599f2.png';
import { parseFiltersFromQuery } from "@/shared/filters";
import { useProducts, useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem } from "@/lib/products";

const categoryData = {
  "0-2": {
    name: "Tiny Tots",
    ageRange: "0-2 Years",
    description: "Soft, comfortable clothes designed for babies and toddlers",
    color: "#FF6B6B"
  },
  "3-5": {
    name: "Little Explorers", 
    ageRange: "3-5 Years",
    description: "Durable playwear perfect for active preschoolers",
    color: "#4ECDC4"
  },
  "6-8": {
    name: "Young Adventurers",
    ageRange: "6-8 Years", 
    description: "Stylish outfits ideal for school and play",
    color: "#FFE66D"
  },
  "9-12": {
    name: "Big Kids",
    ageRange: "9-12 Years",
    description: "Trendy fashion for tweens and pre-teens",
    color: "#27AE60"
  }
};

export default function CategoryPage() {
  const [match, params] = useRoute("/category/:category");
  const categoryId = params?.category as keyof typeof categoryData;
  const category = categoryData[categoryId];
  
  const { data: dbProducts = [], isLoading } = useProducts();
  const { data: cartData } = useCart();
  const addToCartMutation = useAddToCart();
  const updateCartQuantityMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [filterByType, setFilterByType] = useState("all");

  // Map database session cart to frontend items
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

  // Initialize filters from URL query string
  useEffect(() => {
    const filters = parseFiltersFromQuery(window.location.search);
    if (filters.sort) setSortBy(filters.sort);
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    if (type) setFilterByType(type);
  }, []);

  // Keep URL in sync when filters change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (filterByType && filterByType !== "all") params.set("type", filterByType); else params.delete("type");
    if (sortBy && sortBy !== "featured") params.set("sort", sortBy); else params.delete("sort");
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  }, [sortBy, filterByType]);

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemCount={0} />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <p className="text-muted-foreground">The category you're looking for doesn't exist.</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Filter products by category and sub-type
  const categoryProducts = dbProducts.filter(product => {
    const matchesAge = product.ageGroup.includes(category.ageRange);
    const matchesType = filterByType === "all" || product.category.toLowerCase().includes(filterByType.toLowerCase());
    return matchesAge && matchesType;
  });

  // Sort products
  const sortedProducts = [...categoryProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleAddToCart = (productId: string, size: string) => {
    addToCartMutation.mutate({ productId, size, quantity: 1 });
  };



  return (
    <div className="min-h-screen bg-background" data-testid={`page-category-${categoryId}`}>
      {/* Header */}
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Category Hero */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <Badge 
              className="mb-4 text-sm px-4 py-2"
              style={{ backgroundColor: category.color, color: 'white' }}
              data-testid={`badge-age-range-${categoryId}`}
            >
              {category.ageRange}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold font-poppins mb-4" data-testid={`text-category-title-${categoryId}`}>
              {category.name}
            </h1>
            <p className="text-lg text-muted-foreground font-open-sans" data-testid={`text-category-description-${categoryId}`}>
              {category.description}
            </p>
          </div>
        </div>
      </section>

      {/* Filters and Products */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Filters Bar */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-poppins">Filter & Sort</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Product Type</label>
                  <Select value={filterByType} onValueChange={setFilterByType}>
                    <SelectTrigger data-testid="select-filter-type">
                      <SelectValue placeholder="All Products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="t-shirts">T-Shirts</SelectItem>
                      <SelectItem value="dresses">Dresses</SelectItem>
                      <SelectItem value="shorts">Shorts</SelectItem>
                      <SelectItem value="jumpsuits">Jumpsuits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger data-testid="select-sort-by">
                      <SelectValue placeholder="Featured" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-4" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground" data-testid={`text-product-count-${categoryId}`}>
                  Showing {sortedProducts.length} products
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSortBy("featured");
                    setFilterByType("all");
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <span className="text-muted-foreground font-medium animate-pulse">Loading products...</span>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found in this category.</p>
            </div>
          ) : (
            <ProductGrid
              products={sortedProducts}
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
        onUpdateQuantity={(itemId, quantity) => {
          updateCartQuantityMutation.mutate({ id: itemId, quantity });
        }}
        onRemoveItem={(itemId) => {
          removeCartItemMutation.mutate(itemId);
        }}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
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