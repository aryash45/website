import type { Product as DBProduct } from "@shared/schema";
import type { Product as UIProduct } from "@/components/ProductCard";

export function mapDbProductToUi(product: DBProduct): UIProduct {
  const price = Number(product.price);
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : undefined;
  const image = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : "";
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    ageGroup: product.ageGroup,
    sizes: product.sizes,
    inStock: product.inStock,
    isNew: product.isNew ?? false,
    discount: product.discount ?? null,
    price,
    originalPrice,
    image,
    description: product.description ?? null,
    images: product.images,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}


