import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import logoImage from "@assets/Screenshot 2025-08-23 111437_1757995149826.png";

const categories = [
  { name: "0-2 Years", path: "/category/0-2" },
  { name: "3-5 Years", path: "/category/3-5" },
  { name: "6-8 Years", path: "/category/6-8" },
  { name: "9-12 Years", path: "/category/9-12" },
];

interface HeaderProps {
  cartItemCount?: number;
  onSearchChange?: (query: string) => void;
  onCartClick?: () => void;
}

export default function Header({ cartItemCount = 0, onSearchChange, onCartClick }: HeaderProps) {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange?.(query);
  };

  const handleCartClick = () => {
    console.log("Cart clicked");
    onCartClick?.();
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Mahajan Garments" className="h-12 w-auto" />
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for kids wear..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="button-menu-toggle"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={handleCartClick}
              data-testid="button-cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  data-testid="badge-cart-count"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 pb-3">
          {categories.map((category) => (
            <Link key={category.path} href={category.path} data-testid={`link-category-${category.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
              <Button
                variant={location === category.path ? "default" : "ghost"}
                className="font-medium"
              >
                {category.name}
              </Button>
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-card">
          <div className="container mx-auto px-4 py-4">
            {/* Mobile Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for kids wear..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
                data-testid="input-search-mobile"
              />
            </div>

            {/* Mobile Categories */}
            <nav className="space-y-2">
              {categories.map((category) => (
                <Link key={category.path} href={category.path} data-testid={`link-category-mobile-${category.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                  <Button
                    variant={location === category.path ? "default" : "ghost"}
                    className="w-full justify-start font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category.name}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}