import PayableRealizationDetail from '@/components/screens/payable/detail-realization';
import PayableRealizationForm from '@/components/screens/payable/form-realization';
import { useLocalSearchParams } from 'expo-router';

export default function PayableRealizationScreen() {
  const { actionRealization } = useLocalSearchParams();

  const detail = actionRealization === 'detail';

  if (detail) return <PayableRealizationDetail />;

  return <PayableRealizationForm />;
}
