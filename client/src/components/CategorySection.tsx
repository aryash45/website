import { Button } from "@/components/ui/button";
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
    <section className="py-12" data-testid="section-categories">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-4" data-testid="text-categories-title">
            Shop by Age Group
          </h2>
          <p className="text-lg text-muted-foreground font-open-sans max-w-2xl mx-auto" data-testid="text-categories-description">
            Find the perfect fit for every stage of your child's growth journey
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Card 
              key={category.id} 
              className="group hover-elevate cursor-pointer overflow-hidden"
              onClick={() => handleCategoryClick(category.id)}
              data-testid={`card-category-${category.id}`}
            >
              <div className="relative">
                {/* Category Image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={category.image}
                    alt={`${category.name} clothing collection`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {/* Colored overlay */}
                  <div 
                    className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
                    style={{ backgroundColor: category.color }}
                  />
                </div>

                {/* Age Range Badge */}
                <div className="absolute top-3 left-3">
                  <div 
                    className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                    style={{ backgroundColor: category.color }}
                    data-testid={`badge-age-range-${category.id}`}
                  >
                    {category.ageRange}
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg font-poppins" data-testid={`text-category-name-${category.id}`}>
                    {category.name}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground font-open-sans" data-testid={`text-category-description-${category.id}`}>
                    {category.description}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground" data-testid={`text-item-count-${category.id}`}>
                      {category.itemCount} items
                    </span>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="p-0 h-auto text-primary hover:text-primary/80"
                      data-testid={`button-shop-category-${category.id}`}
                    >
                      Shop Now
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}