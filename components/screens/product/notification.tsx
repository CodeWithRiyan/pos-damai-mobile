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
} from '@/components/ui';
import { ShowByStock, useProducts } from '@/hooks/use-product';
import classNames from 'classnames';
import { ChevronRight } from 'lucide-react-native';

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
  const { data } = useProducts();
  const noStockLength = data?.filter((d) => d.stock === 0).length || 0;
  const lowStockLength = data?.filter((d) => d.stock <= d.minimumStock && d.stock > 0).length || 0;
  const allStockLength = data?.length || 0;

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
                isDisabled={noStockLength === 0}
                className={classNames(
                  'p-4 border bg-background-100 border-background-300 rounded-full flex flex-1 items-center justify-center',
                  value === 'NO_STOCK' && 'bg-primary-200 text-primary-500 border-primary-500',
                  noStockLength === 0 && 'pointer-events-none opacity-50',
                )}
              >
                <Box
                  className={classNames(
                    'size-4 rounded-full bg-background-300',
                    noStockLength > 0 && ' bg-error-500',
                  )}
                />
                <Text className="flex-1 font-bold">{`Stok Habis : ${noStockLength} Barang`}</Text>
                <Icon as={ChevronRight} size="md" color="#6b7280" />
              </Radio>
              <Radio
                value="LOW_STOCK"
                size="md"
                isInvalid={false}
                isDisabled={lowStockLength === 0}
                className={classNames(
                  'p-4 border bg-background-100 border-background-300 rounded-full flex flex-1 items-center justify-center',
                  value === 'LOW_STOCK' && 'bg-primary-200 text-primary-500 border-primary-500',
                  lowStockLength === 0 && 'pointer-events-none opacity-50',
                )}
              >
                <Box
                  className={classNames(
                    'size-4 rounded-full bg-background-300',
                    lowStockLength > 0 && ' bg-warning-500',
                  )}
                />
                <Text className="flex-1 font-bold">
                  {`Stok Menipis : ${lowStockLength} Barang`}
                </Text>
                <Icon as={ChevronRight} size="md" color="#6b7280" />
              </Radio>
              <Radio
                value="ALL_STOCK"
                size="md"
                isInvalid={false}
                isDisabled={false}
                className={classNames(
                  'p-4 border bg-background-100 border-background-300 rounded-full flex flex-1 items-center justify-center',
                  value === 'ALL_STOCK' && 'bg-primary-200 text-primary-500 border-primary-500',
                )}
              >
                <Box className="size-4 bg-primary-500 rounded-full" />
                <Text className="flex-1 font-bold">{`Semua Stok : ${allStockLength} Barang`}</Text>
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
