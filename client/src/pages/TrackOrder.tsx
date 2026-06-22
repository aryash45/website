import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart, { type CartItem } from "@/components/ShoppingCart";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/lib/products";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Loader2, Package, Check, Truck, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function TrackOrder() {
  const { data: cartData } = useCart();
  const updateCartQuantityMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [searchParams, setSearchParams] = useState<{ orderId: string; email: string } | null>(null);

  // Auto-fill from URL query params
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    const orderId = params.get("orderId");
    if (email && orderId) {
      setEmailInput(email);
      setOrderIdInput(orderId);
      setSearchParams({ email, orderId });
    }
  });

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

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/orders/track", searchParams],
    queryFn: async () => {
      if (!searchParams) return null;
      const res = await apiRequest(
        "GET",
        `/api/orders/track?email=${encodeURIComponent(searchParams.email)}&orderId=${encodeURIComponent(searchParams.orderId)}`
      );
      return res.json();
    },
    enabled: !!searchParams,
    retry: false
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput.trim() || !emailInput.trim()) return;
    setSearchParams({ orderId: orderIdInput.trim(), email: emailInput.trim() });
  };

  const getStatusStep = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending": return 0;
      case "confirmed": return 1;
      case "shipped": return 2;
      case "delivered": return 3;
      default: return 0;
    }
  };

  const statusSteps = [
    { label: "Pending", icon: ClockIcon },
    { label: "Confirmed", icon: Check },
    { label: "Shipped", icon: Truck },
    { label: "Delivered", icon: Home }
  ];

  const currentStep = order ? getStatusStep(order.status) : -1;

  return (
    <div className="min-h-screen bg-background" data-testid="page-track-order">
      {/* Header */}
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h1 className="text-4xl font-bold font-poppins mb-4">Track Your Order</h1>
          <p className="text-muted-foreground font-open-sans">
            Enter your order ID and the email address used at checkout to track shipment status.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="mb-8 font-poppins">
            <CardHeader>
              <CardTitle className="text-xl">Search Order</CardTitle>
              <CardDescription>All fields are required</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    value={orderIdInput}
                    onChange={(e) => setOrderIdInput(e.target.value)}
                    placeholder="e.g. 5ff83..."
                    required
                  />
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="your-email@example.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Search Result */}
          {isLoading && (
            <div className="flex flex-col justify-center items-center py-12">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Finding your order details...</p>
            </div>
          )}

          {error && (
            <Card className="border-destructive bg-destructive/10 text-center py-8 font-poppins">
              <CardContent className="space-y-2">
                <p className="text-destructive font-semibold text-lg">Order Not Found</p>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Please verify your Order ID and Email address. Ensure they match exactly with the order confirmation.
                </p>
              </CardContent>
            </Card>
          )}

          {order && (
            <div className="space-y-6 font-poppins">
              {/* Order Status Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Order Reference</span>
                      <h2 className="text-xl font-bold font-mono select-all break-all">{order.id}</h2>
                    </div>
                    <div className="text-right md:text-left">
                      <span className="text-xs text-muted-foreground block">Current Status</span>
                      <Badge className="text-sm font-semibold capitalize mt-1 px-3 py-1">
                        {order.status}
                      </Badge>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Progress Timeline */}
                  <div className="relative flex flex-col sm:flex-row justify-between items-center gap-6 py-4">
                    {/* Progress Bar Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 sm:left-0 sm:right-0 sm:top-1/2 w-0.5 sm:w-auto sm:h-0.5 bg-muted -translate-x-1/2 sm:translate-x-0 sm:-translate-y-1/2 z-0" />
                    <div 
                      className="absolute left-1/2 top-0 bottom-0 sm:left-0 sm:top-1/2 w-0.5 sm:h-0.5 bg-primary transition-all duration-500 -translate-x-1/2 sm:translate-x-0 sm:-translate-y-1/2 z-0" 
                      style={{ 
                        height: typeof window !== "undefined" && window.innerWidth < 640 ? `${(currentStep / 3) * 100}%` : "0.5px",
                        width: typeof window !== "undefined" && window.innerWidth >= 640 ? `${(currentStep / 3) * 100}%` : "0.5px"
                      }}
                    />

                    {statusSteps.map((step, idx) => {
                      const Icon = step.icon;
                      const isCompleted = idx <= currentStep;
                      const isCurrent = idx === currentStep;

                      return (
                        <div key={idx} className="relative z-10 flex flex-col sm:flex-row items-center sm:items-center gap-2">
                          <div 
                            className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              isCompleted 
                                ? "bg-primary border-primary text-primary-foreground" 
                                : "bg-background border-muted text-muted-foreground"
                            } ${isCurrent ? "ring-4 ring-primary/20 scale-110" : ""}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="text-center sm:text-left">
                            <p className={`text-sm font-semibold ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                              {step.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Order Details & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Items Ordered</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 text-sm">
                          <h4 className="font-semibold line-clamp-1">{item.productName}</h4>
                          <p className="text-muted-foreground text-xs">Size {item.size} • Qty {item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold">₹{parseFloat(item.price) * item.quantity}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Shipping & Payment summary */}
                <Card className="flex flex-col justify-between">
                  <div>
                    <CardHeader>
                      <CardTitle className="text-lg">Shipping Address</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1 text-muted-foreground">
                      <p className="text-foreground font-semibold">{order.customerName}</p>
                      <p>{order.shippingAddress.address}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}</p>
                      <p>Phone: {order.customerPhone || "N/A"}</p>
                    </CardContent>
                  </div>
                  
                  <div className="border-t p-6 mt-4 bg-muted/20 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>₹{order.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping:</span>
                      <span>{parseFloat(order.shipping) === 0 ? "Free" : `₹${order.shipping}`}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-base text-foreground">
                      <span>Total Amount:</span>
                      <span>₹{order.total}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Shopping Cart Drawer */}
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

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
