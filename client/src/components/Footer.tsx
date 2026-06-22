import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Footer() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast({
      title: "Successfully Subscribed!",
      description: `Welcome to Rajouri Kids! We've sent a 10% welcome coupon to ${email}.`,
    });
    setEmail("");
  };

  return (
    <footer className="w-full rounded-t-[3rem] mt-12 bg-[#FAFAFA] border-t-4 border-accent-yellow dark:bg-zinc-950" data-testid="footer">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 py-16 max-w-7xl mx-auto">
        {/* Column 1: Company Info */}
        <div className="space-y-6">
          <div className="font-headline font-black text-primary text-3xl flex items-center gap-2" data-testid="text-footer-company-name">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
            Rajouri Kids
          </div>
          <p className="font-body text-sm text-[#2C3E50]/70 dark:text-zinc-400 leading-relaxed" data-testid="text-footer-tagline">
            Premium children's wear for every little occasion. Mahajan Garments bringing you the finest selection of quality clothes since 1995.
          </p>
          <div className="space-y-3 text-sm text-[#2C3E50]/70 dark:text-zinc-400 font-body">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary">map</span>
              <span data-testid="text-footer-address">Rajouri Garden, New Delhi, India</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-secondary">call</span>
              <span data-testid="text-footer-phone">+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-accent-yellow">mail</span>
              <span data-testid="text-footer-email">hello@mahajangarments.com</span>
            </div>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="font-headline font-bold text-xl text-[#2C3E50] dark:text-white mb-6 border-b-2 border-primary/20 inline-block pb-1">Quick Links</h4>
          <ul className="space-y-4">
            {[
              { name: "Size Guide", href: "/size-guide" },
              { name: "Track Order", href: "/track-order" },
              { name: "Store Locator", href: "/stores" },
              { name: "Help & FAQ", href: "/help" }
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} data-testid={`link-footer-${link.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <span className="font-body text-sm text-[#2C3E50]/80 dark:text-zinc-400 hover:text-primary transition-colors flex items-center gap-2 cursor-pointer">
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    {link.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Categories */}
        <div>
          <h4 className="font-headline font-bold text-xl text-[#2C3E50] dark:text-white mb-6 border-b-2 border-secondary/20 inline-block pb-1">Collections</h4>
          <ul className="space-y-4">
            {[
              { name: "0-2 Years", href: "/category/0-2" },
              { name: "3-5 Years", href: "/category/3-5" },
              { name: "6-8 Years", href: "/category/6-8" },
              { name: "9-12 Years", href: "/category/9-12" }
            ].map((category) => (
              <li key={category.href}>
                <Link href={category.href} data-testid={`link-footer-category-${category.name.replace(/\s+/g, '-').toLowerCase()}`}>
                  <span className="font-body text-sm text-[#2C3E50]/80 dark:text-zinc-400 hover:text-secondary transition-colors flex items-center gap-2 cursor-pointer">
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    {category.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Stay Playful Subscription */}
        <div>
          <h4 className="font-headline font-bold text-xl text-[#2C3E50] dark:text-white mb-6 border-b-2 border-accent-yellow/20 inline-block pb-1">Stay Playful</h4>
          <p className="font-body text-sm text-[#2C3E50]/80 dark:text-zinc-400 mb-6">Subscribe for exclusive offers and new arrivals!</p>
          
          <form onSubmit={handleNewsletterSubmit} className="relative">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800 text-accent-navy dark:text-white rounded-full px-6 py-4 border-2 border-transparent focus:border-accent-yellow focus:ring-0 shadow-sm text-sm transition-colors"
              data-testid="input-newsletter-email"
              required
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-primary text-white rounded-full hover:bg-accent-coral flex items-center justify-center transition-all shadow-md"
              data-testid="button-newsletter-submit"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>

          {/* Social icons */}
          <div className="flex gap-4 mt-6">
            <button type="button" className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 shadow-md flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-200 hover:-translate-y-1" data-testid="button-social-instagram">
              <span className="material-symbols-outlined">public</span>
            </button>
            <button type="button" className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 shadow-md flex items-center justify-center text-secondary hover:bg-secondary hover:text-white transition-all duration-200 hover:-translate-y-1" data-testid="button-social-facebook">
              <span className="material-symbols-outlined">alternate_email</span>
            </button>
            <button type="button" className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 shadow-md flex items-center justify-center text-accent-yellow hover:bg-accent-yellow hover:text-accent-navy transition-all duration-200 hover:-translate-y-1" data-testid="button-social-twitter">
              <span className="material-symbols-outlined">call</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center bg-white/50 dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body text-xs text-[#2C3E50]/60 dark:text-zinc-400 font-medium">
            © 2024 Rajouri Kids (Mahajan Garments). All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-[#2C3E50]/60 dark:text-zinc-400 font-body">
            <Link href="/privacy" data-testid="link-footer-privacy">
              <span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
            </Link>
            <Link href="/terms" data-testid="link-footer-terms">
              <span className="hover:text-primary transition-colors cursor-pointer">Terms of Service</span>
            </Link>
            <Link href="/returns" data-testid="link-footer-returns">
              <span className="hover:text-primary transition-colors cursor-pointer">Return Policy</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}