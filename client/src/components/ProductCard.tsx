import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart } from "lucide-react";

import { type Product as DBProduct } from "@shared/schema";

export interface Product extends Omit<DBProduct, 'price' | 'originalPrice'> {
  price: number;
  originalPrice?: number;
  image: string; // Will use first image from images array
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
  isFavorite = false 
}: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const [isLoading, setIsLoading] = useState(false);

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
    onToggleFavorite?.(product.id);
  };

  return (
    <Card className="group overflow-hidden hover-elevate" data-testid={`card-product-${product.id}`}>
      <div className="relative">
        {/* Product Image */}
        <div className="aspect-[4/5] overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            data-testid={`img-product-${product.id}`}
          />
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <Badge variant="default" className="bg-primary text-primary-foreground">
              New
            </Badge>
          )}
          {product.discount && (
            <Badge variant="destructive">
              -{product.discount}%
            </Badge>
          )}
          {!product.inStock && (
            <Badge variant="secondary">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
          onClick={handleToggleFavorite}
          data-testid={`button-favorite-${product.id}`}
        >
          <Heart 
            className={`h-4 w-4 ${isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground'}`} 
          />
        </Button>

        {/* Age Group Badge */}
        <div className="absolute bottom-2 left-2">
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
            {product.ageGroup}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
          
          <p className="text-xs text-muted-foreground" data-testid={`text-product-category-${product.id}`}>
            {product.category}
          </p>

          {/* Price */}
          <div className="flex items-center gap-2" data-testid={`text-product-price-${product.id}`}>
            <span className="font-bold text-lg">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {/* Size Selection */}
          {product.inStock && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Size:
              </label>
              <div className="flex gap-1 flex-wrap">
                {product.sizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
                    onClick={() => setSelectedSize(size)}
                    data-testid={`button-size-${size}-${product.id}`}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={!product.inStock || !selectedSize || isLoading}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            {isLoading ? (
              "Adding..."
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {product.inStock ? "Add to Cart" : "Out of Stock"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}