import {
  Heading,
  HStack,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pressable,
  Text,
  VStack,
} from '@/components/ui';
import SelectModal from '@/components/ui/select/select-modal';
import { useBrands } from '@/hooks/use-brand';
import { useCategories } from '@/hooks/use-category';

export default function ProductFilter({
  brandId,
  setBrandId,
  categoryId,
  setCategoryId,
  open,
  setOpen,
}: {
  brandId: string;
  setBrandId: (brandId: string) => void;
  categoryId: string;
  setCategoryId: (categoryId: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const hasFiltered = Boolean(brandId || categoryId);

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
            FILTER
          </Heading>
        </ModalHeader>
        <ModalBody className="m-0" showsVerticalScrollIndicator={false}>
          <VStack space="lg" className="p-4">
            <SelectModal
              value={categoryId}
              placeholder="Pilih Kategori"
              searchPlaceholder="Cari Kategori"
              options={categories?.map((cat) => ({
                label: cat.name,
                value: cat.id,
              }))}
              className="flex-1"
              onChange={(v) => setCategoryId(v || '')}
            />
            <SelectModal
              value={brandId}
              placeholder="Pilih Brand"
              searchPlaceholder="Cari Brand"
              options={brands?.map((brand) => ({
                label: brand.name,
                value: brand.id,
              }))}
              className="flex-1"
              onChange={(v) => setBrandId(v || '')}
            />
          </VStack>
        </ModalBody>
        <ModalFooter className="p-4 pt-0">
          <HStack space="md">
            <Pressable
              className="flex-1 flex px-4 h-12 items-center justify-center rounded-lg border border-primary-500 bg-background-0 active:bg-background-100"
              onPress={() => {
                setOpen(false);
              }}
            >
              <Text size="sm" className="text-primary-500 font-bold">
                TUTUP
              </Text>
            </Pressable>
            {hasFiltered && (
              <Pressable
                className="flex-1 flex px-4 h-12 items-center justify-center rounded-lg border border-error-500 bg-error-100 active:bg-error-200"
                onPress={() => {
                  setBrandId('');
                  setCategoryId('');
                  setOpen(false);
                }}
              >
                <Text size="sm" className="text-error-500 font-bold">
                  BERSIHKAN FILTER
                </Text>
              </Pressable>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
