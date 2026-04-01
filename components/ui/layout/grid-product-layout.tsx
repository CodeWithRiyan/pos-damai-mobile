import { Badge, BadgeText, Box, Heading, Pressable, Text, VStack } from '@/components/ui';
import { formatRp } from '@/lib/utils/format';

export default function GridProductLayout({
  name,
  price,
  quantityInCart,
  stock,
  minStock = 1,
  onPressProduct,
}: {
  name: string;
  price: number;
  quantityInCart?: number;
  stock?: number;
  minStock?: number;
  onPressProduct: () => void;
}) {
  return (
    <Pressable
      className="bg-white p-1 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50"
      onPress={onPressProduct}
    >
      <VStack space="sm" className="relative items-start">
        <Box className="relative w-full aspect-square rounded-lg bg-primary-200 items-center justify-center mb-1">
          <Heading size="xl" className="text-primary-500 font-bold">
            {name.charAt(0).toUpperCase()}
          </Heading>
          {/* Badge Stok & Keranjang */}
          {stock !== undefined && (
            <Badge
              action={
                stock > minStock ? 'info' : stock < minStock && stock > 0 ? 'warning' : 'error'
              }
              className="absolute bottom-1 left-1"
            >
              <BadgeText>Stok: {stock}</BadgeText>
            </Badge>
          )}
        </Box>

        {/* Info Produk */}
        <VStack className="w-full">
          <Heading size="xs" className="line-clamp-2 text-slate-800">
            {name}
          </Heading>
          <Text size="sm" className="font-semibold text-primary-600">
            {formatRp(price)}
          </Text>
        </VStack>

        {/* Indikator Keranjang (hanya muncul jika > 0) */}
        {quantityInCart !== undefined && quantityInCart > 0 && (
          <Box className="absolute top-1 right-1 bg-orange-500 size-6 rounded-md items-center justify-center">
            <Text size="xs" className="text-white font-bold">
              {quantityInCart}
            </Text>
          </Box>
        )}
      </VStack>
    </Pressable>
  );
}
