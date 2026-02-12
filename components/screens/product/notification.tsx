import {
  Box,
  Heading,
  HStack,
  Icon,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pressable,
  Radio,
  RadioGroup,
  Text,
  VStack,
} from "@/components/ui";
import { ShowByStock } from "@/lib/api/products";
import { ChevronRight } from "lucide-react-native";

export default function ProductNotification({
  value,
  onChange,
  open,
  setOpen,
}: {
  value: ShowByStock;
  onChange: (value?: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Modal
      isOpen={open}
      onClose={() => {
        setOpen(false);
      }}
      size="md"
    >
      <ModalBackdrop />
      <ModalContent className="p-0 max-h-[90%]">
        <ModalHeader className="p-4 border-b border-background-300">
          <Heading size="md" className="text-center flex-1">
            NOTIFIKASI
          </Heading>
        </ModalHeader>
        <ModalBody className="m-0" showsVerticalScrollIndicator={false}>
          <VStack space="lg" className="p-4">
            <RadioGroup
              value={value}
              onChange={(v) => {
                onChange(v);
                setOpen(false);
              }}
              className="gap-2"
            >
              <Radio
                value="NO_STOCK"
                size="md"
                isInvalid={false}
                isDisabled={false} // TODO: isDisabled true jika no stock = 0
                className={`p-4 border rounded-full flex flex-1 items-center justify-center${
                  value === "NO_STOCK"
                    ? " bg-primary-200 text-primary-500 border-primary-500"
                    : " bg-background-100 border-background-300"
                }`}
              >
                <Box className="size-4 bg-error-500 rounded-full" />
                {/* TODO: hardcode dengan data dinamis */}
                <Text className="flex-1 font-bold">Stok Habis : 0 Barang</Text>
                <Icon as={ChevronRight} size="md" color="#6b7280" />
              </Radio>
              <Radio
                value="LOW_STOCK"
                size="md"
                isInvalid={false}
                isDisabled={false} // TODO: isDisabled true jika low stock = 0
                className={`p-4 border rounded-full flex flex-1 items-center justify-center${
                  value === "LOW_STOCK"
                    ? " bg-primary-200 text-primary-500 border-primary-500"
                    : " bg-background-100 border-background-300"
                }`}
              >
                <Box className="size-4 bg-warning-500 rounded-full" />
                {/* TODO: hardcode dengan data dinamis */}
                <Text className="flex-1 font-bold">
                  Stok Menipis : 0 Barang
                </Text>
                <Icon as={ChevronRight} size="md" color="#6b7280" />
              </Radio>
              <Radio
                value="ALL_STOCK"
                size="md"
                isInvalid={false}
                isDisabled={false}
                className={`p-4 border rounded-full flex flex-1 items-center justify-center${
                  value === "ALL_STOCK"
                    ? " bg-primary-200 text-primary-500 border-primary-500"
                    : " bg-background-100 border-background-300"
                }`}
              >
                <Box className="size-4 bg-primary-500 rounded-full" />
                {/* TODO: hardcode dengan data dinamis */}
                <Text className="flex-1 font-bold">Semua Stok : 0 Barang</Text>
                <Icon as={ChevronRight} size="md" color="#6b7280" />
              </Radio>
            </RadioGroup>
          </VStack>
        </ModalBody>
        <ModalFooter className="p-4 pt-0">
          <HStack space="md">
            <Pressable
              className="w-full flex px-4 h-12 items-center justify-center rounded-lg border border-primary-500 bg-background-0 active:bg-background-100"
              onPress={() => {
                setOpen(false);
              }}
            >
              <Text size="sm" className="text-primary-500 font-bold">
                TUTUP
              </Text>
            </Pressable>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
