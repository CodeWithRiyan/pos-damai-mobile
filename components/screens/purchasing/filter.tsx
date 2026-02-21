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
} from "@/components/ui";
import SelectModal from "@/components/ui/select/select-modal";
import { useSuppliers } from "@/lib/api/suppliers";

export default function PurchasingFilter({
  supplierId,
  setSupplierId,
  open,
  setOpen,
}: {
  supplierId: string;
  setSupplierId: (supplierId: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { data: suppliers = [] } = useSuppliers();
  const hasFiltered = Boolean(supplierId);

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
              value={supplierId}
              placeholder="Pilih Supplier"
              searchPlaceholder="Cari Supplier"
              options={suppliers?.map((supplier) => ({
                label: supplier.name,
                value: supplier.id,
              }))}
              className="flex-1"
              onChange={(v) => setSupplierId(v || "")}
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
                  setSupplierId("");
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
