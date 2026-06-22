import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart, { type CartItem } from "@/components/ShoppingCart";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/lib/products";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SizeGuide() {
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

  const babySizes = [
    { size: "XS", age: "0-6 Months", height: "55-65 cm", weight: "3-6 kg" },
    { size: "S", age: "6-12 Months", height: "65-75 cm", weight: "6-9 kg" },
    { size: "M", age: "12-18 Months", height: "75-85 cm", weight: "9-12 kg" },
    { size: "L", age: "18-24 Months", height: "85-90 cm", weight: "12-14 kg" }
  ];

  const kidSizes = [
    { size: "XS (Age 3-4)", age: "3-4 Years", height: "95-105 cm", chest: "54-56 cm", weight: "14-18 kg" },
    { size: "S (Age 5-6)", age: "5-6 Years", height: "105-115 cm", chest: "57-60 cm", weight: "18-22 kg" },
    { size: "M (Age 7-8)", age: "7-8 Years", height: "115-125 cm", chest: "61-64 cm", weight: "22-28 kg" },
    { size: "L (Age 9-10)", age: "9-10 Years", height: "125-135 cm", chest: "65-70 cm", weight: "28-35 kg" },
    { size: "XL (Age 11-12)", age: "11-12 Years", height: "135-145 cm", chest: "71-76 cm", weight: "35-42 kg" }
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="page-size-guide">
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h1 className="text-4xl font-bold font-poppins mb-4">Size Guide</h1>
          <p className="text-muted-foreground font-open-sans">
            Find the perfect fit for your little ones. If you are in between sizes, we recommend ordering one size up.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Tabs defaultValue="toddler" className="w-full font-poppins">
            <TabsList className="grid grid-cols-2 max-w-md mx-auto mb-8">
              <TabsTrigger value="toddler">Baby & Toddler (0-2 Years)</TabsTrigger>
              <TabsTrigger value="kids">Kids (3-12 Years)</TabsTrigger>
            </TabsList>

            <TabsContent value="toddler">
              <Card>
                <CardHeader>
                  <CardTitle>Toddler Sizing Chart</CardTitle>
                  <CardDescription>Ideal for newborns, infants, and toddlers up to age 2.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Standard Size</TableHead>
                        <TableHead>Target Age Range</TableHead>
                        <TableHead>Height Limit</TableHead>
                        <TableHead>Weight Range</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {babySizes.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold text-primary">{row.size}</TableCell>
                          <TableCell>{row.age}</TableCell>
                          <TableCell>{row.height}</TableCell>
                          <TableCell>{row.weight}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kids">
              <Card>
                <CardHeader>
                  <CardTitle>Kids Sizing Chart</CardTitle>
                  <CardDescription>Perfect fit metrics for young children and tweens.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Standard Size</TableHead>
                        <TableHead>Recommended Age Group</TableHead>
                        <TableHead>Height Limit</TableHead>
                        <TableHead>Chest Girth</TableHead>
                        <TableHead>Weight Range</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kidSizes.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold text-primary">{row.size}</TableCell>
                          <TableCell>{row.age}</TableCell>
                          <TableCell>{row.height}</TableCell>
                          <TableCell>{row.chest}</TableCell>
                          <TableCell>{row.weight}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
