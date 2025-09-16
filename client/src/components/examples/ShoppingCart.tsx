import { useState } from 'react';
import ShoppingCart from '../ShoppingCart';
import { Button } from '@/components/ui/button';
import coralShirtImage from '@assets/generated_images/Kids_coral_t-shirt_product_a3912b82.png';
import mintDressImage from '@assets/generated_images/Kids_mint_dress_product_59394fee.png';

// todo: remove mock functionality
const mockCartItems = [
  {
    id: "cart-1",
    productId: "1",
    name: "Coral Animal Print T-Shirt",
    price: 899,
    size: "M",
    quantity: 2,
    image: coralShirtImage,
    ageGroup: "3-5 Years"
  },
  {
    id: "cart-2",
    productId: "2",
    name: "Mint Green Floral Dress",
    price: 1599,
    size: "L",
    quantity: 1,
    image: mintDressImage,
    ageGroup: "6-8 Years"
  }
];

export default function ShoppingCartExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState(mockCartItems);

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  return (
    <div className="p-4">
      <Button onClick={() => setIsOpen(true)} data-testid="button-open-cart">
        Open Shopping Cart ({items.length} items)
      </Button>
      
      <ShoppingCart
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={items}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => console.log('Checkout clicked')}
      />
    </div>
  );
}