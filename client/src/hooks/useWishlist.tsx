import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface WishlistContextType {
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const { toast } = useToast();

  // Load wishlist from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("wishlist");
      if (stored) {
        setWishlist(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load wishlist from localStorage:", e);
    }
  }, []);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      let nextWishlist: string[];
      let action: "added" | "removed";

      if (prev.includes(productId)) {
        nextWishlist = prev.filter((id) => id !== productId);
        action = "removed";
      } else {
        nextWishlist = [...prev, productId];
        action = "added";
      }

      localStorage.setItem("wishlist", JSON.stringify(nextWishlist));

      toast({
        title: action === "added" ? "Added to Wishlist" : "Removed from Wishlist",
        description: action === "added" 
          ? "Item has been saved to your favorites." 
          : "Item has been removed from your favorites.",
      });

      return nextWishlist;
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  const clearWishlist = () => {
    setWishlist([]);
    localStorage.removeItem("wishlist");
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
