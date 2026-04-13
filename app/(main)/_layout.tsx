import BrandForm from '@/components/screens/brand/form';
import CashDrawerForm from '@/components/screens/cashdrawer/form';
import CategoryForm from '@/components/screens/category/form';
import CustomerModalForm from '@/components/screens/customer/modal-form';
import DiscountForm from '@/components/screens/discount/form';
import PaymentTypeForm from '@/components/screens/payment-type/form';
import { Sidebar } from '@/components/sidebar';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

export default function MainLayout() {
  const [containerWidth, setContainerWidth] = useState<number>(0);

  return (
    <View
      className="flex-1 flex-row bg-white"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width || 0)}
    >
      <Sidebar deviceWidth={containerWidth} />
      <View className="flex-1">
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationTypeForReplace: 'pop', // This handles the back animation
            presentation: 'card',
          }}
        />
      </View>
      <CategoryForm />
      <BrandForm />
      <CustomerModalForm />
      <DiscountForm />
      <PaymentTypeForm />
      <CashDrawerForm />
    </View>
  );
}
