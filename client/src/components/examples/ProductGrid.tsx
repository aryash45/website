import ProductGrid from '../ProductGrid';
import coralShirtImage from '@assets/generated_images/Kids_coral_t-shirt_product_a3912b82.png';
import mintDressImage from '@assets/generated_images/Kids_mint_dress_product_59394fee.png';
import yellowShortsImage from '@assets/generated_images/Kids_yellow_shorts_product_6ad599f2.png';

// todo: remove mock functionality
const mockProducts = [
  {
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
  },
  {
    id: "2",
    name: "Mint Green Floral Dress",
    price: 1599,
    image: mintDressImage,
    category: "Dresses",
    ageGroup: "6-8 Years",
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    isNew: false
  },
  {
    id: "3",
    name: "Sunny Yellow Cotton Shorts",
    price: 699,
    originalPrice: 999,
    image: yellowShortsImage,
    category: "Shorts",
    ageGroup: "2-4 Years",
    sizes: ["XS", "S", "M"],
    inStock: true,
    isNew: false,
    discount: 30
  },
  {
    id: "4",
    name: "Rainbow Striped Top",
    price: 799,
    image: coralShirtImage,
    category: "T-Shirts",
    ageGroup: "0-2 Years",
    sizes: ["XS", "S"],
    inStock: false
  }
];

export default function ProductGridExample() {
  return (
    <div className="container mx-auto px-4">
      <ProductGrid
        products={mockProducts}
        loading={false}
        hasMore={true}
        onLoadMore={() => console.log('Load more clicked')}
        onAddToCart={(id, size) => console.log(`Added product ${id} size ${size} to cart`)}
        onToggleFavorite={(id) => console.log(`Toggled favorite for product ${id}`)}
        favorites={new Set(['2'])}
      />
    </div>
  );
}