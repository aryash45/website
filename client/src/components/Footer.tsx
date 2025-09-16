import { Link } from "wouter";
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Newsletter subscription submitted");
  };

  return (
    <footer className="bg-card border-t mt-12" data-testid="footer">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg font-poppins" data-testid="text-footer-company-name">
              Mahajan Garments
            </h3>
            <p className="text-sm text-muted-foreground font-open-sans" data-testid="text-footer-tagline">
              Tiny Threads, Big Moments
            </p>
            <p className="text-sm text-muted-foreground font-open-sans">
              Creating beautiful, comfortable clothing for children that grows with their adventures and dreams.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span data-testid="text-footer-address">Rajouri Garden, New Delhi, India</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span data-testid="text-footer-phone">+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span data-testid="text-footer-email">hello@mahajangarments.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold font-poppins">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { name: "About Us", href: "/about" },
                { name: "Size Guide", href: "/size-guide" },
                { name: "Care Instructions", href: "/care" },
                { name: "Track Order", href: "/track-order" },
                { name: "Contact Us", href: "/contact" }
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} data-testid={`link-footer-${link.name.toLowerCase().replace(/\s+/g, '-')}`}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors font-open-sans">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h4 className="font-semibold font-poppins">Shop by Age</h4>
            <ul className="space-y-2">
              {[
                { name: "0-2 Years", href: "/category/0-2" },
                { name: "3-5 Years", href: "/category/3-5" },
                { name: "6-8 Years", href: "/category/6-8" },
                { name: "9-12 Years", href: "/category/9-12" }
              ].map((category) => (
                <li key={category.href}>
                  <Link href={category.href} data-testid={`link-footer-category-${category.name.replace(/\s+/g, '-').toLowerCase()}`}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors font-open-sans">
                      {category.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold font-poppins">Stay Updated</h4>
            <p className="text-sm text-muted-foreground font-open-sans">
              Get the latest collections and exclusive offers delivered to your inbox.
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="text-sm"
                data-testid="input-newsletter-email"
                required
              />
              <Button type="submit" className="w-full" data-testid="button-newsletter-submit">
                Subscribe
              </Button>
            </form>

            {/* Social Media */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium font-poppins">Follow Us</h5>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-social-instagram">
                  <Instagram className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-social-facebook">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-social-twitter">
                  <Twitter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground font-open-sans">
            © 2025 Mahajan Garments. All rights reserved.
          </div>
          
          <div className="flex gap-6 text-sm text-muted-foreground font-open-sans">
            <Link href="/privacy" data-testid="link-footer-privacy">
              <span className="hover:text-foreground transition-colors">Privacy Policy</span>
            </Link>
            <Link href="/terms" data-testid="link-footer-terms">
              <span className="hover:text-foreground transition-colors">Terms of Service</span>
            </Link>
            <Link href="/returns" data-testid="link-footer-returns">
              <span className="hover:text-foreground transition-colors">Return Policy</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}