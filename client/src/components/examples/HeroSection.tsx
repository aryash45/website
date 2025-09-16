import HeroSection from '../HeroSection';

export default function HeroSectionExample() {
  return (
    <HeroSection 
      onShopNowClick={() => console.log('Shop Now clicked from hero')}
    />
  );
}