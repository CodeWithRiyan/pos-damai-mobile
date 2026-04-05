import PurchasingHistory from '@/components/screens/purchasing/history';
import { useLocalSearchParams } from 'expo-router';

export default function PurchasingReportScreen() {
  const { supplierId } = useLocalSearchParams<{ supplierId: string }>();
  return <PurchasingHistory isReport lockedSupplierId={supplierId} />;
}
