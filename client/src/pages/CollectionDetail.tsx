import { useState } from "react";
import { useRoute, Link } from "wouter";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import ShoppingCart, { type CartItem } from "@/components/ShoppingCart";
import CheckoutDialog from "@/components/CheckoutDialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useProducts, useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem } from "@/lib/products";

const collectionsMeta = {
  "tiny-threads": {
    title: "Tiny Threads Collection",
    description: "Cute, soft, and hyper-breathable fabrics curated for babies & toddlers (0-2 years).",
    ageGroups: ["0-2 Years"]
  },
  "explorers-club": {
    title: "Explorers Club Collection",
    description: "Ultra-durable, stretchable cotton wear built for active preschoolers (3-5 years).",
    ageGroups: ["3-5 Years"]
  },
  "schoolyard-trend": {
    title: "Schoolyard Trend Collection",
    description: "Stylish, modern styles blending comfort and trendiness for ages 6-12.",
    ageGroups: ["6-8 Years", "9-12 Years"]
  }
};

export default function CollectionDetail() {
  const [match, params] = useRoute("/collections/:slug");
  const slug = params?.slug as keyof typeof collectionsMeta;
  const meta = collectionsMeta[slug];

  const { data: dbProducts = [], isLoading } = useProducts();
  const { data: cartData } = useCart();
  const addToCartMutation = useAddToCart();
  const updateCartQuantityMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);


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

  if (!meta) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemCount={0} />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4 font-poppins">Collection Not Found</h1>
          <p className="text-muted-foreground mb-6">The collection you are trying to view does not exist.</p>
          <Link href="/collections">
            <Button>Back to Collections</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Filter products by age range defined in collection meta
  const collectionProducts = dbProducts.filter((product) => {
    return meta.ageGroups.some((group) => product.ageGroup.includes(group));
  });

  const handleAddToCart = (productId: string, size: string) => {
    addToCartMutation.mutate({ productId, size, quantity: 1 });
  };



  return (
    <div className="min-h-screen bg-background" data-testid={`page-collection-${slug}`}>
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />

      <section className="py-6 border-b bg-muted/10">
        <div className="container mx-auto px-4">
          <Link href="/collections" className="inline-flex items-center text-sm font-semibold text-primary hover:underline font-poppins">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Collections
          </Link>
        </div>
      </section>

      {/* Collection Header */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold font-poppins mb-4" data-testid={`text-collection-title-${slug}`}>
            {meta.title}
          </h1>
          <p className="text-lg text-muted-foreground font-open-sans">
            {meta.description}
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <span className="text-muted-foreground font-medium animate-pulse">Loading products...</span>
            </div>
          ) : collectionProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found in this collection right now.</p>
            </div>
          ) : (
            <ProductGrid
              products={collectionProducts}
              loading={false}
              hasMore={false}
              onAddToCart={handleAddToCart}
            />
          )}
        </div>
      </section>

      <Footer />

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
