import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  ageRange: string;
  description: string;
  itemCount: number;
  image: string;
  color: string;
}

interface CategorySectionProps {
  categories: Category[];
  onCategoryClick?: (categoryId: string) => void;
}

export default function CategorySection({ categories, onCategoryClick }: CategorySectionProps) {
  const handleCategoryClick = (categoryId: string) => {
    console.log(`Category ${categoryId} clicked`);
    onCategoryClick?.(categoryId);
  };

  return (
    <section className="py-24" data-testid="section-categories">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-16">
          <div>
            <h2 className="text-4xl font-outfit font-extrabold text-accent-navy mb-3" data-testid="text-categories-title">
              Shop by Age
            </h2>
            <p className="text-accent-navy/70 text-lg font-sans" data-testid="text-categories-description">
              Find the perfect fit for your growing little one.
            </p>
          </div>
          <a className="text-primary font-bold flex items-center gap-2 hover:text-primary/80 hover:underline transition-colors text-sm" href="#products-section">
            View All <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {categories.map((category) => {
            const isBigKids = category.name.includes("Big Kids");
            return (
              <div 
                key={category.id} 
                className="group relative bg-white p-8 rounded-3xl text-center shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border-b-4 cursor-pointer"
                style={{ borderBottomColor: category.color }}
                onClick={() => handleCategoryClick(category.id)}
                data-testid={`card-category-${category.id}`}
              >
                {/* Background Bubble */}
                <div 
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-10"
                  style={{ backgroundColor: category.color }}
                />
                
                <div className="relative z-10 flex flex-col items-center">
                  {/* Image/Icon Container */}
                  <div 
                    className="w-32 h-32 mb-6 rounded-full overflow-hidden shadow-2xs border-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                    style={{ 
                      borderColor: `${category.color}22`,
                      backgroundColor: `${category.color}08`
                    }}
                  >
                    {!isBigKids ? (
                      <img
                        src={category.image}
                        alt={`${category.name} clothing collection`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      // Big Kids gets the fallback leaf icon from Stitch
                      <span className="text-emerald-500 font-bold text-5xl font-outfit select-none">
                        🌱
                      </span>
                    )}
                  </div>

                  <h3 className="font-outfit font-bold text-xl text-accent-navy mb-2" data-testid={`text-category-name-${category.id}`}>
                    {category.name}
                  </h3>
                  
                  <p 
                    className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{ 
                      backgroundColor: `${category.color}15`,
                      color: category.color 
                    }}
                    data-testid={`badge-age-range-${category.id}`}
                  >
                    {category.ageRange}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}