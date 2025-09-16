import CategorySection from '../CategorySection';
import coralShirtImage from '@assets/generated_images/Kids_coral_t-shirt_product_a3912b82.png';
import mintDressImage from '@assets/generated_images/Kids_mint_dress_product_59394fee.png';
import yellowShortsImage from '@assets/generated_images/Kids_yellow_shorts_product_6ad599f2.png';

// todo: remove mock functionality
const mockCategories = [
  {
    id: "0-2",
    name: "Tiny Tots",
    ageRange: "0-2 Years",
    description: "Soft, comfortable clothes for babies and toddlers",
    itemCount: 45,
    image: coralShirtImage,
    color: "#FF6B6B"
  },
  {
    id: "3-5",
    name: "Little Explorers",
    ageRange: "3-5 Years",
    description: "Durable playwear for active preschoolers",
    itemCount: 68,
    image: mintDressImage,
    color: "#4ECDC4"
  },
  {
    id: "6-8",
    name: "Young Adventurers",
    ageRange: "6-8 Years",
    description: "Stylish outfits for school and play",
    itemCount: 52,
    image: yellowShortsImage,
    color: "#FFE66D"
  },
  {
    id: "9-12",
    name: "Big Kids",
    ageRange: "9-12 Years",
    description: "Trendy fashion for tweens and pre-teens",
    itemCount: 39,
    image: coralShirtImage,
    color: "#27AE60"
  }
];

export default function CategorySectionExample() {
  return (
    <CategorySection
      categories={mockCategories}
      onCategoryClick={(id) => console.log(`Navigating to category: ${id}`)}
    />
  );
}