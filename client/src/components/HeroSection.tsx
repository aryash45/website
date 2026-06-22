import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@assets/generated_images/Family_lifestyle_hero_banner_c78a067d.png";

interface HeroSectionProps {
  onShopNowClick?: () => void;
}

export default function HeroSection({ onShopNowClick }: HeroSectionProps) {
  const handleShopNow = () => {
    console.log("Shop Now clicked");
    onShopNowClick?.();
  };

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden" data-testid="section-hero">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Happy family wearing Mahajan Garments kids clothing"
          className="w-full h-full object-cover"
        />
        {/* Organic Cloud Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-background to-transparent" />
        {/* Playful Blur Blobs */}
        <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 max-w-7xl w-full flex justify-start py-16">
        <div className="max-w-2xl text-left space-y-6">
          <span className="inline-block px-5 py-2 bg-secondary text-white font-bold text-xs uppercase tracking-widest rounded-full shadow-md shadow-secondary/20">
            New Collection 2024
          </span>
          
          <h1 className="text-5xl md:text-7xl font-outfit font-extrabold text-accent-navy leading-[1.1] tracking-tight" data-testid="text-hero-title">
            Tiny Threads, <br />
            <span className="text-primary">Big Moments.</span>
          </h1>
          
          <p className="text-lg text-accent-navy/80 font-sans max-w-md leading-relaxed" data-testid="text-hero-description">
            Curated with love, crafted for comfort. Discover our latest range of playful outfits designed for every little adventure.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Button
              size="lg"
              className="px-10 py-6 bg-primary hover:bg-primary/95 text-white font-bold rounded-full shadow-lg shadow-primary/30 hover-bounce"
              onClick={handleShopNow}
              data-testid="button-shop-now"
            >
              Shop Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="px-10 py-6 bg-white/90 backdrop-blur-sm border-2 border-transparent hover:border-secondary text-accent-navy font-bold rounded-full hover:bg-white hover:text-secondary hover:shadow-lg hover-bounce shadow-sm"
              data-testid="button-view-collection"
            >
              View Collection
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider text-accent-navy/60 pt-4">
            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-xs px-3 py-1.5 rounded-full border border-border shadow-3xs">
              <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
              <span>Free Shipping Over ₹999</span>
            </div>
            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-xs px-3 py-1.5 rounded-full border border-border shadow-3xs">
              <div className="w-2 h-2 bg-secondary rounded-full animate-ping" />
              <span>Easy Returns</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}