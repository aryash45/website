import ProductCard from '../ProductCard';
import coralShirtImage from '@assets/generated_images/Kids_coral_t-shirt_product_a3912b82.png';

const mockProduct = {
  id: "1",
  name: "Coral Animal Print T-Shirt",
  price: 899,
  originalPrice: 1299,
  image: coralShirtImage,
  category: "T-Shirts",
  ageGroup: "3-5 Years",
  sizes: ["XS", "S", "M", "L"],
  inStock: true,
  isNew: true,
  discount: 31
};

export default function ProductCardExample() {
  return (
    <div className="w-72">
      <ProductCard 
        product={mockProduct}
        onAddToCart={(id, size) => console.log(`Added product ${id} size ${size} to cart`)}
        onToggleFavorite={(id) => console.log(`Toggled favorite for product ${id}`)}
        isFavorite={false}
      />
    </div>
  );
}