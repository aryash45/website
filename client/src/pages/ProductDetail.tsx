import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ShoppingCart, { type CartItem } from "@/components/ShoppingCart";
import CheckoutDialog from "@/components/CheckoutDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useProduct, useProducts, useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem } from "@/lib/products";
import { useWishlist } from "@/hooks/useWishlist";
import { Star, Heart, MessageSquare, ChevronRight, ShoppingBag, Ruler, Check, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ProductDetail() {
  const [match, params] = useRoute("/product/:id");
  const productId = params?.id || "";
  
  const { toast } = useToast();
  const { data: product, isLoading: isProductLoading } = useProduct(productId);
  const { data: allProducts = [] } = useProducts();
  const { data: cartData } = useCart();
  const addToCartMutation = useAddToCart();
  const updateCartQuantityMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();

  const [selectedImage, setSelectedImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isFavorite = isInWishlist(product?.id || "");
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  
  // Review Form State
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerRating, setReviewerRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");

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

  // Query reviews for the current product
  const { data: reviews = [], isLoading: isReviewsLoading } = useQuery<any[]>({
    queryKey: [`/api/products/${productId}/reviews`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/products/${productId}/reviews`);
      return res.json();
    },
    enabled: !!productId
  });

  // Post a review mutation
  const postReviewMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", `/api/products/${productId}/reviews`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
      toast({
        title: "Review Submitted",
        description: "Thank you! Your review has been submitted successfully."
      });
      setReviewerName("");
      setReviewerRating(5);
      setReviewContent("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Set default main image and default size when product is loaded
  useEffect(() => {
    if (product) {
      if (product.images && product.images.length > 0) {
        setSelectedImage(product.images[0]);
      } else {
        setSelectedImage(product.image);
      }
      
      if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      }
    }
  }, [product]);

  if (isProductLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} />
        <div className="container mx-auto px-4 py-24 flex flex-col justify-center items-center">
          <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground animate-pulse">Loading product details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold font-poppins mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">We couldn't find the product you're looking for.</p>
          <Link href="/">
            <Button>Back to Shop</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Related products: same category or age group (exclude current)
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || p.ageGroup === product.ageGroup))
    .slice(0, 4);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: "Select Size",
        description: "Please choose a size before adding to cart.",
        variant: "destructive"
      });
      return;
    }
    
    addToCartMutation.mutate({ productId: product.id, size: selectedSize, quantity });
    setIsCartOpen(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(1.8)"
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: "center",
      transform: "scale(1)"
    });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewContent.trim()) return;
    
    postReviewMutation.mutate({
      name: reviewerName.trim(),
      rating: reviewerRating,
      content: reviewContent.trim(),
      isVerified: true // Assume true for demo
    });
  };

  const babySizes = [
    { size: "XS", age: "0-6 Months", height: "55-65 cm", weight: "3-6 kg" },
    { size: "S", age: "6-12 Months", height: "65-75 cm", weight: "6-9 kg" },
    { size: "M", age: "12-18 Months", height: "75-85 cm", weight: "9-12 kg" },
    { size: "L", age: "18-24 Months", height: "85-90 cm", weight: "12-14 kg" }
  ];

  const kidSizes = [
    { size: "XS", age: "3-4 Years", height: "95-105 cm", weight: "14-18 kg" },
    { size: "S", age: "5-6 Years", height: "105-115 cm", weight: "18-22 kg" },
    { size: "M", age: "7-8 Years", height: "115-125 cm", weight: "22-28 kg" },
    { size: "L", age: "9-10 Years", height: "125-135 cm", weight: "28-35 kg" },
    { size: "XL", age: "11-12 Years", height: "135-145 cm", weight: "35-42 kg" }
  ];

  const sizingChart = product.ageGroup.includes("0-2") ? babySizes : kidSizes;

  return (
    <div className="min-h-screen bg-background font-poppins" data-testid={`page-product-detail-${product.id}`}>
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Breadcrumbs */}
      <div className="bg-muted/10 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="container mx-auto px-4 text-sm flex items-center gap-2 flex-wrap">
          <Link href="/">
            <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">Home</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <Link href={`/category/${product.ageGroup.split(' ')[0]}`}>
            <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors capitalize">
              {product.ageGroup}
            </span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold text-accent-navy dark:text-white line-clamp-1">{product.name}</span>
        </div>
      </div>

      {/* Main product area */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* Image Gallery */}
            <div className="space-y-4">
              <div 
                className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-zinc-50 border border-zinc-100 dark:border-zinc-800 shadow-sm cursor-zoom-in group"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={selectedImage || product.image}
                  alt={product.name}
                  style={zoomStyle}
                  className="w-full h-full object-cover transition-transform duration-100 ease-out mix-blend-multiply"
                />
                
                {product.isNew && (
                  <Badge className="absolute top-6 left-6 bg-primary text-white uppercase tracking-widest text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md z-10">
                    New
                  </Badge>
                )}
                {product.discount && (
                  <Badge className="absolute top-6 left-6 bg-accent-yellow text-accent-navy uppercase tracking-widest text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md z-10 mt-8">
                    -{product.discount}%
                  </Badge>
                )}
              </div>

              {/* Thumbnail Selector */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 justify-center">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`w-20 h-20 rounded-xl border-2 overflow-hidden bg-zinc-50 transition-all ${
                        selectedImage === img 
                          ? "border-primary scale-105 shadow-sm" 
                          : "border-zinc-200 hover:border-zinc-400 opacity-80"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Meta & Configuration */}
            <div className="space-y-6">
              <div>
                <Badge className="bg-muted text-accent-navy hover:bg-muted font-bold px-3 py-1 text-[11px] rounded-full uppercase tracking-wider mb-3">
                  {product.category}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-headline font-black tracking-tight text-accent-navy dark:text-white leading-tight">
                  {product.name}
                </h1>
              </div>

              {/* Reviews Summary */}
              <div className="flex items-center gap-2 text-sm">
                <div className="flex text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4.5 w-4.5 ${
                        i < Math.round(parseFloat(averageRating)) ? "fill-current" : "text-zinc-300"
                      }`} 
                    />
                  ))}
                </div>
                <span className="font-semibold text-accent-navy">{averageRating}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" /> {reviews.length} customer reviews
                </span>
              </div>

              <Separator />

              {/* Price Area */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-headline font-black text-accent-navy dark:text-white">
                    ₹{product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xl text-accent-navy/40 dark:text-zinc-500 line-through">
                      ₹{product.originalPrice}
                    </span>
                  )}
                </div>
                <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <Check className="h-3 w-3" /> Inclusive of all taxes
                </p>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed font-open-sans">
                {product.description || "Indulge in premium kidswear comfort from Rajouri Kids. Lovingly crafted with high-quality fabric designed to keep active kids comfortable and styling all day long."}
              </p>

              {/* Selection Options */}
              <div className="space-y-4">
                {/* Size Selection */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-bold uppercase tracking-wider text-accent-navy">Select Size</Label>
                    
                    {/* Size Chart Modal Trigger */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                          <Ruler className="h-3.5 w-3.5" /> Size Guide
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl font-poppins">
                        <DialogHeader>
                          <DialogTitle>Sizing Chart Guide</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            Measurements are based on average body sizes. If your child is in-between, we suggest choosing a size larger.
                          </p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Size</TableHead>
                                <TableHead>Age</TableHead>
                                <TableHead>Height</TableHead>
                                <TableHead>Weight</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sizingChart.map((row, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-semibold text-primary">{row.size}</TableCell>
                                  <TableCell>{row.age}</TableCell>
                                  <TableCell>{row.height}</TableCell>
                                  <TableCell>{row.weight}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((size) => {
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`w-12 h-12 rounded-full border-2 text-xs font-bold transition-all ${
                            isSelected
                              ? "border-primary bg-primary text-white shadow-md shadow-primary/20 scale-105"
                              : "border-zinc-200 hover:border-zinc-400 text-accent-navy bg-white"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity & Actions */}
                <div className="flex gap-4 items-end pt-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-accent-navy">Qty</Label>
                    <div className="flex items-center border-2 border-zinc-200 rounded-full h-12 overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-4 py-2 hover:bg-zinc-100 font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="px-4 py-2 hover:bg-zinc-100 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    disabled={!product.inStock || addToCartMutation.isPending}
                    className="flex-1 h-12 rounded-full bg-primary hover:bg-accent-coral text-white font-bold text-sm shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="h-4.5 w-4.5" />
                    Add to Cart
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      toggleWishlist(product.id);
                    }}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                      isFavorite 
                        ? "bg-primary/10 border-primary text-primary" 
                        : "border-zinc-200 hover:border-primary text-zinc-400"
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                  </button>
                </div>
              </div>

              <Separator />

              {/* Shipping & Trust signals */}
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 space-y-3 text-xs text-accent-navy">
                <div className="flex items-center gap-2 font-semibold">
                  <span className="material-symbols-outlined text-lg text-primary">local_shipping</span>
                  <span>FREE SHIPPING on orders above ₹999</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <span className="material-symbols-outlined text-lg text-secondary">assignment_return</span>
                  <span>Hassle-free 7 Days returns & exchanges</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground font-open-sans">
                  <Info className="h-4 w-4" />
                  <span>Typically dispatches within 24 hours. COD available.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Reviews & Fit Section */}
      <section className="py-12 bg-zinc-50/50 border-t border-zinc-100 dark:border-zinc-800">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-2xl font-bold mb-8">Customer Reviews & Ratings</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Average Rating Summary Card */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6 text-center space-y-4">
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Average Score</p>
                  <div>
                    <h3 className="text-6xl font-black text-accent-navy">{averageRating}</h3>
                    <p className="text-xs text-muted-foreground mt-1">out of 5 stars</p>
                  </div>
                  <div className="flex justify-center text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-5 w-5 ${
                          i < Math.round(parseFloat(averageRating)) ? "fill-current" : "text-zinc-300"
                        }`} 
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{reviews.length} reviews posted by verified customers.</p>
                </CardContent>
              </Card>

              {/* Size & Fit Indicator */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h4 className="font-semibold text-sm">Size Fit Opinion</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Runs Small</span>
                      <span className="font-semibold">True to Size (85%)</span>
                      <span>Runs Large</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full" style={{ width: "80%", marginLeft: "10%" }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Write a Review & Review List */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Review Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Write a Review</CardTitle>
                  <CardDescription>Share your experience with other parents</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="revName">Your Name *</Label>
                        <Input
                          id="revName"
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          required
                          placeholder="e.g. Priya S."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="revRating">Rating *</Label>
                        <select
                          id="revRating"
                          value={reviewerRating}
                          onChange={(e) => setReviewerRating(parseInt(e.target.value))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value={5}>5 Stars - Excellent</option>
                          <option value={4}>4 Stars - Good</option>
                          <option value={3}>3 Stars - Average</option>
                          <option value={2}>2 Stars - Poor</option>
                          <option value={1}>1 Star - Terrible</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="revContent">Review Comments *</Label>
                      <Textarea
                        id="revContent"
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        required
                        placeholder="Write your review here. What did you think about the fabric, fit, and sizing?"
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full md:w-auto" disabled={postReviewMutation.isPending}>
                      Submit Review
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Review list */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Reviews ({reviews.length})</h3>
                
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground text-sm font-open-sans">No reviews yet for this product. Be the first to write a review!</p>
                ) : (
                  reviews.map((r: any) => (
                    <Card key={r.id}>
                      <CardContent className="p-6 space-y-3 font-open-sans">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="font-semibold text-accent-navy text-sm font-poppins">{r.name}</p>
                            <div className="flex text-amber-500 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3.5 w-3.5 ${
                                    i < r.rating ? "fill-current" : "text-zinc-200"
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            {r.isVerified && (
                              <Badge className="bg-green-600/10 text-green-600 border-none text-[9px] uppercase tracking-wider font-bold mb-1">
                                Verified Purchase
                              </Badge>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(r.createdAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-accent-navy/80 leading-relaxed font-open-sans">
                          {r.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-7xl">
            <h2 className="text-3xl font-headline font-bold text-center text-accent-navy mb-4">You May Also Like</h2>
            <p className="text-muted-foreground text-center max-w-xl mx-auto mb-10 text-sm">
              Discover matching styles and alternate colors selected specially for you
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={(prodId, size) => addToCartMutation.mutate({ productId: prodId, size, quantity: 1 })}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />

      {/* Shopping Cart */}
      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={(itemId, qty) => updateCartQuantityMutation.mutate({ id: itemId, quantity: qty })}
        onRemoveItem={(itemId) => removeCartItemMutation.mutate(itemId)}
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
