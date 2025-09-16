import { useState } from "react";
import ProductCard, { type Product } from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onAddToCart?: (productId: string, size: string) => void;
  onToggleFavorite?: (productId: string) => void;
  favorites?: Set<string>;
}

export default function ProductGrid({
  products,
  loading = false,
  onLoadMore,
  hasMore = false,
  onAddToCart,
  onToggleFavorite,
  favorites = new Set()
}: ProductGridProps) {
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    console.log("Loading more products...");
    onLoadMore?.();
    
    // Simulate loading
    setTimeout(() => setLoadingMore(false), 1000);
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center py-12" data-testid="loading-products">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12" data-testid="no-products">
        <h3 className="text-lg font-semibold text-muted-foreground">No products found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="product-grid">
      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favorites.has(product.id)}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={loadingMore}
            data-testid="button-load-more"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Products"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}