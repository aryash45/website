import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart, { type CartItem } from "@/components/ShoppingCart";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/lib/products";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import coralShirtImage from '@assets/generated_images/Kids_coral_t-shirt_product_a3912b82.png';
import mintDressImage from '@assets/generated_images/Kids_mint_dress_product_59394fee.png';
import yellowShortsImage from '@assets/generated_images/Kids_yellow_shorts_product_6ad599f2.png';

const collectionsList = [
  {
    title: "Tiny Threads",
    slug: "tiny-threads",
    description: "Cute, soft, and hyper-breathable fabrics curated for babies & toddlers (0-2 years).",
    image: coralShirtImage,
    count: 24,
    color: "from-pink-500/10 to-red-500/10"
  },
  {
    title: "Explorers Club",
    slug: "explorers-club",
    description: "Ultra-durable, stretchable cotton wear built for active preschoolers (3-5 years).",
    image: mintDressImage,
    count: 36,
    color: "from-teal-500/10 to-emerald-500/10"
  },
  {
    title: "Schoolyard Trend",
    slug: "schoolyard-trend",
    description: "Stylish, modern styles blending comfort and trendiness for ages 6-12.",
    image: yellowShortsImage,
    count: 42,
    color: "from-yellow-500/10 to-amber-500/10"
  }
];

export default function Collections() {
  const { data: cartData } = useCart();
  const updateCartQuantityMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();

  const [isCartOpen, setIsCartOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-background" data-testid="page-collections">
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold font-poppins mb-4">Curated Collections</h1>
          <p className="text-lg text-muted-foreground font-open-sans">
            Hand-picked styles created for everyday comfort, special events, and endless playtime adventures.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {collectionsList.map((col, idx) => (
              <Card key={idx} className="overflow-hidden border group hover:shadow-lg transition-all duration-300">
                <div className={`h-48 bg-gradient-to-tr ${col.color} relative overflow-hidden flex items-center justify-center p-6`}>
                  <img
                    src={col.image}
                    alt={col.title}
                    className="h-40 w-auto object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold">
                    {col.count} Items
                  </div>
                </div>
                <CardContent className="p-6 space-y-3 font-poppins">
                  <h3 className="text-xl font-bold">{col.title}</h3>
                  <p className="text-muted-foreground text-sm font-open-sans line-clamp-3">
                    {col.description}
                  </p>
                  <Link href={`/collections/${col.slug}`}>
                    <Button className="w-full mt-2" variant="outline">
                      Explore Collection
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
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
        onCheckout={() => setIsCartOpen(false)}
      />
    </div>
  );
}
