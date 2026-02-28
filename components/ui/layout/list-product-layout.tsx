import { Box, Heading, HStack, Pressable, Text, VStack } from "@/components/ui";

export default function ListProductLayout({
  name,
  price,
  quantityInCart,
  stock,
  onPressProduct,
}: {
  name: string;
  price: number;
  quantityInCart: number;
  stock: number;
  onPressProduct: () => void;
}) {
  return (
    <Pressable
      className="px-4 py-2 rounded-sm border-b border-gray-300 active:bg-gray-100"
      onPress={onPressProduct}
    >
      <HStack className="justify-between items-center">
        <HStack space="md" className="items-center">
          <Box className="size-16 rounded-lg bg-primary-200 items-center justify-center">
            <Heading className="text-primary-500 font-bold">
              {name.charAt(0).toUpperCase()}
            </Heading>
          </Box>
          <VStack className="flex-1">
            <Heading size="md" className="line-clamp-2">
              {name}
            </Heading>
            <Text size="sm" className="text-slate-500">
              {`Rp ${price.toLocaleString("id-ID")}`}
            </Text>
          </VStack>
          <HStack space="sm">
            <Box className="h-10 min-w-10 items-center justify-center bg-background-0 px-2 rounded-lg border border-gray-300">
              <Text className="font-bold">{quantityInCart}</Text>
            </Box>
            <Box className="h-10 min-w-10 items-center justify-center bg-primary-500 px-2 rounded-lg">
              <Text className="text-typography-0 font-bold">{stock}</Text>
            </Box>
          </HStack>
        </HStack>
      </HStack>
    </Pressable>
  );
}
