import { useState } from "react";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
  ageGroup: string;
}

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}

export default function ShoppingCart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: ShoppingCartProps) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  const handleQuantityChange = (itemId: string, change: number) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change);
      console.log(`Updating quantity for item ${itemId} to ${newQuantity}`);
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    console.log(`Removing item ${itemId} from cart`);
    onRemoveItem(itemId);
  };

  const handleCheckout = () => {
    console.log("Proceeding to checkout");
    onCheckout();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" data-testid="cart-overlay">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Cart Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-xl">
        <Card className="h-full rounded-none border-0 flex flex-col">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <CardTitle className="font-poppins" data-testid="text-cart-title">
              Shopping Cart ({items.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-cart"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          {/* Content */}
          <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
            {items.length === 0 ? (
              /* Empty Cart */
              <div className="flex-1 flex flex-col items-center justify-center p-6" data-testid="empty-cart">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2 font-poppins">Your cart is empty</h3>
                <p className="text-sm text-muted-foreground text-center font-open-sans">
                  Add some beautiful clothes for your little ones to get started!
                </p>
                <Button className="mt-4" onClick={onClose} data-testid="button-continue-shopping">
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="cart-items">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3" data-testid={`cart-item-${item.id}`}>
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium text-sm line-clamp-2 font-poppins" data-testid={`text-item-name-${item.id}`}>
                          {item.name}
                        </h4>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Size {item.size}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.ageGroup}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm" data-testid={`text-item-price-${item.id}`}>
                            ₹{item.price}
                          </span>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleQuantityChange(item.id, -1)}
                              disabled={item.quantity <= 1}
                              data-testid={`button-decrease-${item.id}`}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            
                            <span className="w-8 text-center text-sm" data-testid={`text-quantity-${item.id}`}>
                              {item.quantity}
                            </span>
                            
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleQuantityChange(item.id, 1)}
                              data-testid={`button-increase-${item.id}`}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveItem(item.id)}
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Cart Summary */}
                <div className="border-t p-4 space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between" data-testid="text-subtotal">
                      <span>Subtotal:</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between" data-testid="text-shipping">
                      <span>Shipping:</span>
                      <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                    </div>
                    {subtotal < 999 && (
                      <p className="text-xs text-muted-foreground">
                        Add ₹{999 - subtotal} more for free shipping!
                      </p>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold" data-testid="text-total">
                      <span>Total:</span>
                      <span>₹{total}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleCheckout}
                    data-testid="button-checkout"
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}