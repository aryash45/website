import Header from '../Header';

export default function HeaderExample() {
  return (
    <Header 
      cartItemCount={3}
      onSearchChange={(query) => console.log('Search:', query)}
      onCartClick={() => console.log('Cart clicked')}
    />
  );
}