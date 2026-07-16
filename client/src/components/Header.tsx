import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import WishlistDrawer from "./WishlistDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = [
  { name: "New", path: "/new", hoverColor: "hover:text-accent-coral" },
  { name: "Sale", path: "/sale", hoverColor: "hover:text-accent-yellow" },
  { name: "Collections", path: "/collections", hoverColor: "hover:text-secondary" },
  { name: "👦 Boys", path: "/category/boys", hoverColor: "hover:text-blue-500" },
  { name: "👧 Girls", path: "/category/girls", hoverColor: "hover:text-pink-500" },
];

interface HeaderProps {
  cartItemCount?: number;
  onSearchChange?: (query: string) => void;
  onCartClick?: () => void;
}

export default function Header({ cartItemCount = 0, onSearchChange, onCartClick }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const { wishlist } = useWishlist();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState(() => {
    return new URLSearchParams(window.location.search).get("search") || "";
  });

  // Sync search input with URL search params changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get("search") || "");
  }, [location]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (location === "/") {
      onSearchChange?.(query);
      const url = query.trim() ? `/?search=${encodeURIComponent(query)}` : "/";
      window.history.replaceState(null, "", url);
    } else {
      setLocation(query.trim() ? `/?search=${encodeURIComponent(query)}` : "/");
    }
  };

  const handleCartClick = () => {
    console.log("Cart clicked");
    onCartClick?.();
  };

  return (
    <header className="sticky top-0 w-full z-50 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        {/* Brand Logo */}
        <Link href="/" data-testid="link-home">
          <div className="text-2xl font-headline font-black tracking-tight text-[#2C3E50] dark:text-white flex items-center gap-2 cursor-pointer">
            <span className="text-primary material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
            Rajouri Kids
          </div>
        </Link>

        {/* Pill-shaped Navigation */}
        <nav className="hidden lg:flex items-center gap-2 bg-zinc-100/50 dark:bg-zinc-800/50 p-1.5 rounded-full">
          {categories.map((category) => {
            const isActive = location === category.path;
            return (
              <Link key={category.path} href={category.path} data-testid={`link-category-${category.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                <span 
                  className={`px-5 py-2 font-headline text-sm transition-all duration-200 hover:scale-105 cursor-pointer inline-block rounded-full ${
                    isActive
                      ? "text-primary font-bold bg-white dark:bg-zinc-900 shadow-sm"
                      : `text-[#2C3E50] dark:text-zinc-300 font-medium ${category.hoverColor}`
                  }`}
                >
                  {category.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-4">
          {/* Desktop Search */}
          <div className="relative hidden md:block w-64">
            <input
              type="text"
              placeholder="Search for kids wear..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 text-accent-navy dark:text-white rounded-full border border-zinc-200 dark:border-zinc-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all text-sm"
              data-testid="input-search"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">search</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Favorites Icon */}
            <button 
              type="button"
              onClick={() => setIsWishlistOpen(true)}
              className="p-2 hover:bg-accent-coral/20 rounded-full transition-colors text-accent-navy dark:text-zinc-300 hover:text-accent-coral relative"
              data-testid="button-favorite"
            >
              <span className="material-symbols-outlined text-2xl">favorite</span>
              {wishlist.length > 0 && (
                <span 
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-coral text-white text-[9px] flex items-center justify-center rounded-full font-bold"
                  data-testid="badge-wishlist-count"
                >
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              type="button"
              onClick={handleCartClick}
              className="p-2 hover:bg-secondary/20 rounded-full transition-colors text-accent-navy dark:text-zinc-300 hover:text-secondary relative animate-wobble"
              data-testid="button-cart"
            >
              <span className="material-symbols-outlined text-2xl">shopping_bag</span>
              {cartItemCount > 0 && (
                <span 
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] flex items-center justify-center rounded-full font-bold"
                  data-testid="badge-cart-count"
                >
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Profile Icon with Dropdown Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    type="button"
                    className="p-2 hover:bg-accent-yellow/20 rounded-full transition-colors text-accent-navy dark:text-zinc-300 hover:text-accent-yellow cursor-pointer"
                    data-testid="button-profile"
                  >
                    <span className="material-symbols-outlined text-2xl text-accent-yellow fill-accent-yellow" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 font-poppins">
                  <DropdownMenuLabel className="font-semibold text-xs text-muted-foreground">
                    Logged in as {user?.username}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">account_circle</span>
                      My Profile
                    </DropdownMenuItem>
                  </Link>
                  {isAdmin && (
                    <Link href="/admin">
                      <DropdownMenuItem className="cursor-pointer flex items-center gap-2 text-primary font-medium">
                        <span className="material-symbols-outlined text-sm">dashboard</span>
                        Admin Panel
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      logout();
                      setLocation("/");
                    }}
                    className="cursor-pointer flex items-center gap-2 text-red-500 focus:text-red-500"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <button 
                  type="button"
                  className="p-2 hover:bg-accent-yellow/20 rounded-full transition-colors text-accent-navy dark:text-zinc-300 hover:text-accent-yellow cursor-pointer"
                  data-testid="button-profile"
                >
                  <span className="material-symbols-outlined text-2xl">person</span>
                </button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-accent-navy dark:text-zinc-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="button-menu-toggle"
            >
              <span className="material-symbols-outlined text-2xl">
                {isMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-zinc-100 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-900 transition-all duration-300">
          <div className="px-6 py-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search for kids wear..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 text-accent-navy dark:text-white rounded-full border border-zinc-200 dark:border-zinc-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all text-sm"
                data-testid="input-search-mobile"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">search</span>
            </div>

            {/* Mobile Categories */}
            <nav className="flex flex-col gap-2">
              {categories.map((category) => {
                const isActive = location === category.path;
                return (
                  <Link key={category.path} href={category.path} data-testid={`link-category-mobile-${category.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                    <span
                      className={`px-4 py-2.5 font-headline text-sm rounded-full cursor-pointer block transition-all ${
                        isActive
                          ? "bg-primary text-white font-bold"
                          : "text-[#2C3E50] dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850 font-medium"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {category.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Wishlist Drawer */}
      <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
    </header>
  );
}