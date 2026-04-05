import PayableForm from '@/components/screens/payable/form';
import { useLocalSearchParams } from 'expo-router';

export default function PayableActionId() {
  const { action } = useLocalSearchParams();

  const form = action === 'add' || action === 'edit';

  if (form) return <PayableForm />;
}
