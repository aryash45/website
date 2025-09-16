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
    <section className="relative h-[60vh] md:h-[70vh] overflow-hidden" data-testid="section-hero">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Happy family wearing Mahajan Garments kids clothing"
          className="w-full h-full object-cover"
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl space-y-6">
          {/* Main Heading */}
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold text-white font-poppins" data-testid="text-hero-title">
              Tiny Threads,{" "}
              <span className="text-primary">Big Moments</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 font-open-sans" data-testid="text-hero-subtitle">
              Beautiful clothing for beautiful children
            </p>
          </div>

          {/* Description */}
          <p className="text-lg text-gray-300 max-w-lg font-open-sans" data-testid="text-hero-description">
            Discover our colorful collection of comfortable, high-quality kids wear designed for every adventure. From toddlers to tweens, we've got the perfect fit for your little ones.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
              onClick={handleShopNow}
              data-testid="button-shop-now"
            >
              Shop Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 font-semibold px-8"
              data-testid="button-view-collection"
            >
              View Collection
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-6 text-sm text-gray-300 font-open-sans">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Free Shipping Over ₹999</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Easy Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Quality Guaranteed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}