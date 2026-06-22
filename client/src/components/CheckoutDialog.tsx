import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useClearCart } from "@/lib/products";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, LogIn, UserPlus } from "lucide-react";

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  subtotal: number;
  shipping: number;
  total: number;
}

export default function CheckoutDialog({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  shipping,
  total,
}: CheckoutDialogProps) {
  const { toast } = useToast();
  const clearCartMutation = useClearCart();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [pincodeStatus, setPincodeStatus] = useState<{
    isValid: boolean;
    deliveryText: string;
  } | null>(null);
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  useEffect(() => {
    if (isOpen && isAuthenticated && user) {
      const defaultAddr = user.addresses?.find((a: any) => a.isDefault) || user.addresses?.[0];
      
      setFormData({
        customerName: defaultAddr?.name || user.username || "",
        customerEmail: user.email || "",
        customerPhone: defaultAddr?.phone || user.phone || "",
        address: defaultAddr?.address || "",
        city: defaultAddr?.city || "",
        state: defaultAddr?.state || "",
        zipCode: defaultAddr?.zipCode || "",
      });

      if (defaultAddr?.zipCode && defaultAddr.zipCode.length === 6) {
        const isDelhi = defaultAddr.zipCode.startsWith("110");
        setPincodeStatus({
          isValid: true,
          deliveryText: isDelhi 
            ? "Express Delivery: 1-2 business days (Delhi NCR)" 
            : "Standard Delivery: 3-5 business days"
        });
      } else {
        setPincodeStatus(null);
      }
    }
  }, [isOpen, isAuthenticated, user]);

  const createOrderMutation = useMutation({
    mutationFn: async (orderPayload: any) => {
      const res = await apiRequest("POST", "/api/orders", orderPayload);
      return res.json();
    },
    onSuccess: (data) => {
      setOrderId(data.id);
      clearCartMutation.mutate();
      toast({
        title: "Order Placed!",
        description: `Your order has been recorded successfully. Selected: ${paymentMethod.toUpperCase()}`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Checkout Failed",
        description: err.message || "An error occurred during checkout.",
        variant: "destructive",
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, zipCode: value }));
    
    if (value.length === 6) {
      const isDelhi = value.startsWith("110");
      setPincodeStatus({
        isValid: true,
        deliveryText: isDelhi 
          ? "Express Delivery: 1-2 business days (Delhi NCR)" 
          : "Standard Delivery: 3-5 business days"
      });
    } else {
      setPincodeStatus(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    const shippingAddress = {
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      paymentMethod,
    };

    const items = cartItems.map((item) => ({
      productId: item.productId,
      productName: item.name,
      productImage: item.image,
      size: item.size,
      quantity: item.quantity,
      price: item.price.toString(),
    }));

    const orderPayload = {
      orderData: {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone || null,
        shippingAddress,
        subtotal: subtotal.toString(),
        shipping: shipping.toString(),
        total: total.toString(),
        status: "pending",
        paymentIntentId: paymentMethod === "cod" ? "cod" : `${paymentMethod}-mock-${Date.now()}`,
      },
      items,
    };

    createOrderMutation.mutate(orderPayload);
  };

  const handleClose = () => {
    setOrderId(null);
    setPaymentMethod("cod");
    setPincodeStatus(null);
    setFormData({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    });
    onClose();
  };

  const freeShippingThreshold = 999;
  const remainingForFreeShipping = freeShippingThreshold - subtotal;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto font-poppins">
        {/* ---- Login Gate: shown when not authenticated ---- */}
        {!isAuthenticated ? (
          <div className="flex flex-col items-center text-center py-8 px-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold mb-2">Sign In to Place Your Order</DialogTitle>
            <DialogDescription className="text-muted-foreground mb-6">
              Your cart is saved! Please log in or create an account to complete your purchase.
            </DialogDescription>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button
                className="w-full bg-primary hover:bg-accent-coral text-white font-bold h-11 rounded-full uppercase tracking-wider cursor-pointer"
                onClick={() => { handleClose(); setLocation("/login"); }}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Login to My Account
              </Button>
              <Button
                variant="outline"
                className="w-full font-bold h-11 rounded-full uppercase tracking-wider cursor-pointer"
                onClick={() => { handleClose(); setLocation("/login"); }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </Button>
            </div>
          </div>
        ) : orderId ? (
          /* Order Complete State */
          <div className="flex flex-col items-center text-center py-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4 animate-bounce" />
            <DialogTitle className="text-2xl font-bold mb-2">Order Confirmed!</DialogTitle>
            <DialogDescription className="text-muted-foreground mb-6">
              Thank you for shopping with us. Your order details are registered.
            </DialogDescription>
            
            <div className="bg-muted p-4 rounded-lg w-full mb-6 text-left space-y-2">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Order ID</span>
                <p className="font-mono text-sm font-semibold select-all break-all">{orderId}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                <div>
                  <span className="text-xs text-muted-foreground">Name</span>
                  <p className="font-medium">{formData.customerName}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Total Status</span>
                  <p className="font-semibold text-green-600">₹{total} ({paymentMethod.toUpperCase()})</p>
                </div>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Continue Shopping
            </Button>
          </div>
        ) : (
          /* Checkout Form State */
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Checkout</DialogTitle>
              <DialogDescription>
                Provide your shipping and contact information to complete the order.
              </DialogDescription>
            </DialogHeader>

            {remainingForFreeShipping > 0 ? (
              <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border border-amber-200">
                <span className="material-symbols-outlined text-sm">info</span>
                <span>Add ₹{remainingForFreeShipping} more to unlock FREE SHIPPING!</span>
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border border-green-200">
                <span className="material-symbols-outlined text-sm">local_shipping</span>
                <span>Congratulations! Your order qualifies for FREE SHIPPING!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email Address *</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    required
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Shipping Address *</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Street name, Apartment/Suite, Landmark"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="zipCode">Pincode *</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleZipCodeChange}
                    required
                    placeholder="110001"
                  />
                </div>
              </div>
              {pincodeStatus && (
                <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">local_shipping</span>
                  {pincodeStatus.deliveryText}
                </p>
              )}

              {/* Payment Method Selector */}
              <div className="space-y-2 border-t pt-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-accent-navy block mb-2">Select Payment Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      paymentMethod === "cod"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-zinc-200 hover:border-zinc-300 bg-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">payments</span>
                    <span className="text-[10px] font-bold">COD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      paymentMethod === "upi"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-zinc-200 hover:border-zinc-300 bg-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">qr_code_2</span>
                    <span className="text-[10px] font-bold">UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-zinc-200 hover:border-zinc-300 bg-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">credit_card</span>
                    <span className="text-[10px] font-bold">Card</span>
                  </button>
                </div>
              </div>

              {/* UPI Sub-form */}
              {paymentMethod === "upi" && (
                <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl space-y-3 border flex flex-col items-center">
                  <div className="w-24 h-24 bg-white p-1 rounded-lg border flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=rajourikids@icici%26pn=Rajouri%20Kids%26am=${total}%26cu=INR`} 
                      alt="UPI QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-accent-navy">Scan QR Code or Enter UPI ID</p>
                    <p className="text-[9px] text-muted-foreground">Works with PhonePe, Google Pay, Paytm, etc.</p>
                  </div>
                  <Input placeholder="e.g. name@upi" className="h-9 bg-white" required />
                </div>
              )}

              {/* Card Sub-form */}
              {paymentMethod === "card" && (
                <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl space-y-3 border">
                  <p className="text-xs font-bold text-accent-navy uppercase tracking-wider mb-2">Card Details (Demo Mode)</p>
                  <div className="space-y-3">
                    <Input placeholder="Card Number (4242 4242 4242 4242)" className="h-9 bg-white" required />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="MM / YY" className="h-9 bg-white" required />
                      <Input placeholder="CVV" type="password" maxLength={3} className="h-9 bg-white" required />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 mt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Grand Total</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-4 bg-primary hover:bg-accent-coral text-white font-bold h-12 rounded-full uppercase tracking-wider cursor-pointer"
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  `Pay & Place Order (₹${total})`
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
