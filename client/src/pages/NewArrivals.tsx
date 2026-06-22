import { useState } from "react";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import ShoppingCart, { type CartItem } from "@/components/ShoppingCart";
import CheckoutDialog from "@/components/CheckoutDialog";
import { useProducts, useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem } from "@/lib/products";

export default function NewArrivals() {
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

  // Filter for new products
  const newProducts = dbProducts.filter((product) => product.isNew);

  const handleAddToCart = (productId: string, size: string) => {
    addToCartMutation.mutate({ productId, size, quantity: 1 });
  };



  return (
    <div className="min-h-screen bg-background" data-testid="page-new-arrivals">
      {/* Header */}
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Hero Header */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold font-poppins mb-4" data-testid="text-new-arrivals-title">
            New Arrivals
          </h1>
          <p className="text-lg text-muted-foreground font-open-sans">
            Explore our fresh new styles. Comfortable, playful, and top-quality clothing carefully crafted for your kids.
          </p>
        </div>
      </section>

      {/* Products list */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <span className="text-muted-foreground font-medium animate-pulse">Loading products...</span>
            </div>
          ) : newProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No new items found right now. Check back soon!</p>
            </div>
          ) : (
            <ProductGrid
              products={newProducts}
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
