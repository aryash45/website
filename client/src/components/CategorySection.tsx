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
    onCategoryClick?.(categoryId);
  };

  return (
    <section className="py-24" data-testid="section-categories">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-16">
          <div>
            <h2 className="text-4xl font-outfit font-extrabold text-accent-navy mb-3" data-testid="text-categories-title">
              Shop by Gender
            </h2>
            <p className="text-accent-navy/70 text-lg font-sans" data-testid="text-categories-description">
              Find the perfect style for your little one.
            </p>
          </div>
          <a className="text-primary font-bold flex items-center gap-2 hover:text-primary/80 hover:underline transition-colors text-sm" href="#products-section">
            View All <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Categories Grid — 2 large cards for Boys and Girls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-3xl mx-auto">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group relative bg-white p-10 rounded-3xl text-center shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border-b-4 cursor-pointer"
              style={{ borderBottomColor: category.color }}
              onClick={() => handleCategoryClick(category.id)}
              data-testid={`card-category-${category.id}`}
            >
              {/* Background Bubble */}
              <div
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-10"
                style={{ backgroundColor: category.color }}
              />

              <div className="relative z-10 flex flex-col items-center">
                {/* Image container */}
                <div
                  className="w-36 h-36 mb-6 rounded-full overflow-hidden shadow-md border-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                  style={{
                    borderColor: `${category.color}33`,
                    backgroundColor: `${category.color}10`
                  }}
                >
                  <img
                    src={category.image}
                    alt={`${category.name} clothing collection`}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="font-outfit font-bold text-2xl text-accent-navy mb-2" data-testid={`text-category-name-${category.id}`}>
                  {category.name}
                </h3>

                <p
                  className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
                  style={{
                    backgroundColor: `${category.color}15`,
                    color: category.color
                  }}
                  data-testid={`badge-gender-${category.id}`}
                >
                  {category.ageRange}
                </p>

                <p className="text-sm text-accent-navy/60">{category.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}