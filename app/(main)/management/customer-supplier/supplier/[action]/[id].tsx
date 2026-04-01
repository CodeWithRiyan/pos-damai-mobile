import SupplierDetail from '@/components/screens/supplier/detail';
import SupplierForm from '@/components/screens/supplier/form';
import SelectProductInSupplier from '@/components/screens/supplier/select-product-in-supplier';
import { useLocalSearchParams } from 'expo-router';

export default function SupplierActionScreen() {
  const { action } = useLocalSearchParams<{ action: string; id: string }>();

  if (action === 'edit') return <SupplierForm />;
  if (action === 'select-product') return <SelectProductInSupplier />;

  return <SupplierDetail />;
}
