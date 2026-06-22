import { useState } from "react";
import { X, Heart, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWishlist } from "@/hooks/useWishlist";
import { useProducts, useAddToCart } from "@/lib/products";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
  const { wishlist, toggleWishlist, clearWishlist } = useWishlist();
  const { data: products = [], isLoading } = useProducts();
  const addToCartMutation = useAddToCart();
  const { toast } = useToast();

  // Keep track of selected sizes for each product ID
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  // Filter products in wishlist
  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  const handleSizeChange = (productId: string, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleAddToCart = (productId: string, productName: string, sizes: string[]) => {
    // Determine size (user selected or fallback to first size)
    const size = selectedSizes[productId] || sizes[0] || "M";

    addToCartMutation.mutate(
      { productId, size, quantity: 1 },
      {
        onSuccess: () => {
          // Remove from wishlist after successfully adding to cart
          toggleWishlist(productId);
          toast({
            title: "Added to Cart!",
            description: `"${productName}" (Size ${size}) has been added to your shopping cart.`,
          });
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" data-testid="wishlist-overlay">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Wishlist Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-xl animate-slide-in-right">
        <Card className="h-full rounded-none border-0 flex flex-col">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-accent-coral fill-accent-coral" />
              <CardTitle className="font-poppins text-lg" data-testid="text-wishlist-title">
                My Wishlist ({wishlistProducts.length})
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {wishlistProducts.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={clearWishlist}
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                data-testid="button-close-wishlist"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-muted-foreground animate-pulse">Loading wishlist...</span>
              </div>
            ) : wishlistProducts.length === 0 ? (
              /* Empty Wishlist State */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center" data-testid="empty-wishlist">
                <div className="w-16 h-16 bg-accent-coral/10 rounded-full flex items-center justify-center mb-4">
                  <Heart className="h-8 w-8 text-accent-coral" />
                </div>
                <h3 className="font-semibold text-lg mb-2 font-poppins">Your wishlist is empty</h3>
                <p className="text-sm text-muted-foreground max-w-xs font-open-sans">
                  Tap the heart icon on any product card while browsing to save your favorites here.
                </p>
                <Button className="mt-6 bg-primary hover:bg-accent-coral rounded-full px-6" onClick={onClose}>
                  Explore Collections
                </Button>
              </div>
            ) : (
              /* Wishlist Items List */
              <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="wishlist-items">
                {wishlistProducts.map((product) => {
                  const currentSize = selectedSizes[product.id] || product.sizes[0] || "M";
                  
                  return (
                    <div key={product.id} className="flex gap-4 p-2 rounded-xl border hover:border-zinc-200 transition-colors" data-testid={`wishlist-item-${product.id}`}>
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details & Actions */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-medium text-sm line-clamp-1 font-poppins text-accent-navy">
                            {product.name}
                          </h4>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-bold text-sm text-accent-navy">
                              ₹{product.price}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                              {product.ageGroup}
                            </span>
                          </div>
                        </div>

                        {/* Cart Size Selector & Add to Cart */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-24">
                            <Select
                              value={currentSize}
                              onValueChange={(val) => handleSizeChange(product.id, val)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Size" />
                              </SelectTrigger>
                              <SelectContent>
                                {product.sizes.map((sz) => (
                                  <SelectItem key={sz} value={sz} className="text-xs">
                                    Size {sz}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            size="sm"
                            className="h-8 flex-1 text-xs bg-primary hover:bg-accent-coral rounded-md font-bold"
                            onClick={() => handleAddToCart(product.id, product.name, product.sizes)}
                            disabled={!product.inStock}
                          >
                            {product.inStock ? "Add to Cart" : "Out of Stock"}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => toggleWishlist(product.id)}
                            title="Remove from favorites"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
