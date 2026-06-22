import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart, { type CartItem } from "@/components/ShoppingCart";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/lib/products";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Phone, Clock, ExternalLink } from "lucide-react";

export default function Stores() {
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

  const storeLocations = [
    {
      name: "Mahajan Garments - Rajouri Garden",
      address: "J-84, Main Market, Rajouri Garden, New Delhi, 110027",
      phone: "+91 11 4567 8901",
      hours: "11:00 AM - 9:00 PM (Open All Days)",
      mapLink: "https://maps.google.com/?q=Rajouri+Garden+Main+Market+New+Delhi"
    },
    {
      name: "Mahajan Kids Outlet - Punjabi Bagh",
      address: "24, Central Market, Punjabi Bagh West, New Delhi, 110026",
      phone: "+91 11 4567 8902",
      hours: "11:00 AM - 9:00 PM (Closed on Mondays)",
      mapLink: "https://maps.google.com/?q=Punjabi+Bagh+Central+Market+New+Delhi"
    }
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="page-stores">
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h1 className="text-4xl font-bold font-poppins mb-4">Our Store Locations</h1>
          <p className="text-muted-foreground font-open-sans">
            Visit us in store to see our collections in person and get sizing recommendations from our retail experts.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {storeLocations.map((store, idx) => (
              <Card key={idx} className="font-poppins flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">{store.name}</CardTitle>
                  <CardDescription>Flagship Kids Wear Outlet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex gap-2.5 items-start">
                      <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-foreground font-open-sans leading-relaxed">{store.address}</p>
                    </div>

                    <div className="flex gap-2.5 items-center">
                      <Phone className="h-5 w-5 text-primary shrink-0" />
                      <a href={`tel:${store.phone.replace(/\s+/g, "")}`} className="hover:underline text-foreground">
                        {store.phone}
                      </a>
                    </div>

                    <div className="flex gap-2.5 items-center">
                      <Clock className="h-5 w-5 text-primary shrink-0" />
                      <p className="text-foreground">{store.hours}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href={store.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                    >
                      View on Google Maps
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </div>
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
