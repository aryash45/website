import { useQuery, useMutation } from "@tanstack/react-query";
import { type Product as DBProduct } from "@shared/schema";
import { type Product } from "@/components/ProductCard";
import { apiRequest, queryClient } from "./queryClient";

// Transform database product to frontend product
export function transformProduct(dbProduct: DBProduct): Product {
  return {
    ...dbProduct,
    price: parseFloat(dbProduct.price),
    originalPrice: dbProduct.originalPrice ? parseFloat(dbProduct.originalPrice) : undefined,
    image: dbProduct.images[0] || '', // Use first image
  };
}

// Hook to fetch all products
export function useProducts() {
  return useQuery({
    queryKey: ['/api/products'],
    select: (data: DBProduct[]) => data.map(transformProduct),
  });
}

// Hook to fetch a single product
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['/api/products', id],
    select: (data: DBProduct) => transformProduct(data),
    enabled: !!id,
  });
}

// Hook to add item to cart
export function useAddToCart() {
  return useMutation({
    mutationFn: async ({ productId, size, quantity = 1 }: {
      productId: string;
      size: string;
      quantity?: number;
    }) => {
      const response = await apiRequest('POST', '/api/cart/items', {
        productId,
        size,
        quantity,
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate cart queries to refetch cart data
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });
}

// Hook to fetch cart
export function useCart() {
  return useQuery<any>({
    queryKey: ['/api/cart'],
  });
}

// Hook to update cart item quantity
export function useUpdateCartItem() {
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const response = await apiRequest('PUT', `/api/cart/items/${id}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });
}

// Hook to remove cart item
export function useRemoveCartItem() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/cart/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });
}

// Hook to clear cart
export function useClearCart() {
  return useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', '/api/cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });
}