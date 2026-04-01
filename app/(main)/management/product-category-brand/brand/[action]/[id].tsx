import BrandDetail from '@/components/screens/brand/detail';
import SelectProductInBrand from '@/components/screens/brand/select-product-in-brand';
import { useLocalSearchParams } from 'expo-router';

export default function BrandActionScreen() {
  const { action } = useLocalSearchParams();

  if (action === 'select-product') return <SelectProductInBrand />;

  return <BrandDetail />;
}
