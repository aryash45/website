import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";

import { type Product as DBProduct } from "@shared/schema";

// UI Product type: minimal fields required by the UI, with backend-only fields optional
export interface Product extends Pick<DBProduct, 'id' | 'name' | 'category' | 'ageGroup' | 'sizes' | 'inStock'> {
  price: number;
  originalPrice?: number;
  image: string; // First image or a derived URL for display
  description?: string | null;
  images?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  isNew?: boolean;
  discount?: number | null;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string, size: string) => void;
  onToggleFavorite?: (productId: string) => void;
  isFavorite?: boolean;
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onToggleFavorite, 
  isFavorite: isFavoriteProp 
}: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isFavorite = isFavoriteProp !== undefined ? isFavoriteProp : isInWishlist(product.id);

  const handleAddToCart = async () => {
    if (!selectedSize) return;
    
    setIsLoading(true);
    console.log(`Adding ${product.name} (size: ${selectedSize}) to cart`);
    onAddToCart?.(product.id, selectedSize);
    
    // Simulate loading
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleToggleFavorite = () => {
    console.log(`Toggling favorite for ${product.name}`);
    toggleWishlist(product.id);
    onToggleFavorite?.(product.id);
  };

  const mainImage = product.image;
  const hoverImage = product.images && product.images.length > 1 ? product.images[1] : null;

  return (
    <div 
      className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full border border-zinc-100 dark:border-zinc-800" 
      data-testid={`card-product-${product.id}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
        {/* Product Image Link */}
        <Link href={`/product/${product.id}`}>
          <div className="w-full h-full cursor-pointer">
            <img
              src={mainImage}
              alt={product.name}
              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 mix-blend-multiply ${
                hoverImage ? "group-hover:opacity-0" : ""
              }`}
              data-testid={`img-product-${product.id}`}
            />
            {hoverImage && (
              <img
                src={hoverImage}
                alt={`${product.name} alternate view`}
                className="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-110 mix-blend-multiply"
              />
            )}
          </div>
        </Link>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
          {product.isNew && (
            <div className="bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">
              New
            </div>
          )}
          {product.discount && (
            <div className="bg-accent-yellow text-accent-navy text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">
              -{product.discount}%
            </div>
          )}
          {!product.inStock && (
            <div className="bg-zinc-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">
              Out of Stock
            </div>
          )}
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2.5 rounded-full shadow-sm hover:bg-primary hover:text-white hover:shadow-md transition-all duration-200 z-10"
          onClick={handleToggleFavorite}
          data-testid={`button-favorite-${product.id}`}
        >
          <Heart 
            className={`h-5 w-5 transition-colors ${
              isFavorite ? "fill-primary text-primary group-hover:text-white group-hover:fill-white" : "text-accent-navy"
            }`} 
          />
        </button>

        {/* Age Group Badge */}
        <div className="absolute bottom-4 left-4 z-10">
          <span className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 font-headline font-bold border border-zinc-200 shadow-2xs text-[10px] text-accent-navy uppercase tracking-wider">
            {product.ageGroup}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow bg-white dark:bg-zinc-900">
        <p className="text-xs font-bold text-accent-navy/50 dark:text-zinc-400 uppercase tracking-widest mb-2" data-testid={`text-product-category-${product.id}`}>
          {product.category}
        </p>
        <Link href={`/product/${product.id}`}>
          <h3 className="font-headline font-bold text-lg text-accent-navy dark:text-white mb-4 group-hover:text-primary transition-colors leading-tight line-clamp-2 cursor-pointer" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
        </Link>

        {/* Size Selection */}
        {product.inStock && product.sizes && product.sizes.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              {product.sizes.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    className={`w-8 h-8 rounded-full border text-[10px] font-bold transition-all ${
                      isSelected
                        ? "border-primary bg-primary text-white shadow-md shadow-primary/30"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-primary hover:text-primary text-accent-navy dark:text-zinc-300 bg-white dark:bg-zinc-800"
                    }`}
                    onClick={() => setSelectedSize(size)}
                    data-testid={`button-size-${size}-${product.id}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Area with Price and Add to Cart */}
        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <div className="flex flex-col" data-testid={`text-product-price-${product.id}`}>
            <span className="text-2xl font-headline font-black text-accent-navy dark:text-white">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-accent-navy/40 dark:text-zinc-500 line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!product.inStock || !selectedSize || isLoading}
            onClick={handleAddToCart}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              isLoading
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                : !product.inStock
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                : "bg-accent-navy text-white hover:bg-primary hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95 cursor-pointer"
            }`}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}