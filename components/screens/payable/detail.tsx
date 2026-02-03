import { useActionDrawer } from "@/components/action-drawer";
import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import {
  Box,
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  CheckIcon,
  Heading,
  HStack,
  Icon,
  Text,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
import { Pressable } from "@/components/ui/pressable";
import {
  SolarIconBold,
  SolarIconBoldDuotone,
  SolarIconLinear,
} from "@/components/ui/solar-icon-wrapper";
import { getErrorMessage } from "@/lib/api/client";
import { useDeletePayable, usePayableBySupplier, Payable } from "@/lib/api/payable";
import { Spinner } from "@/components/ui/spinner";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CalendarIcon } from "lucide-react-native";
import { useState } from "react";
import { ScrollView } from "react-native";

export default function PayableDetail() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const params = useLocalSearchParams();
  const supplierId = params.supplierId as string;

  const { data: payableList = [], isLoading, refetch } = usePayableBySupplier(supplierId);
  const deleteMutation = useDeletePayable();

  const [selectedItems, setSelectedItems] = useState<Payable[] | null>(null);
  const [showTransactionDatePicker, setShowTransactionDatePicker] =
    useState<boolean>(false);
  const [transactionDate, setDueDate] = useState<Date | null>(null);
  const [statuses, setStatuses] = useState<string[]>(["Lunas", "Belum Lunas"]);

  const payable = payableList[0];

  const toast = useToast();

  const handlePayablePress = (payable: Payable) => {
    if (selectedItems?.some((r) => r.id === payable.id)) {
      setSelectedItems(selectedItems.filter((r) => r.id !== payable.id));
      return;
    }
    if (!selectedItems) {
      setSelectedItems([payable]);
      return;
    }

    setSelectedItems([...selectedItems, payable]);
  };

  const showErrorToast = (error: unknown) => {
    toast.show({
      placement: "top",
      render: ({ id }) => {
        const toastId = "toast-" + id;
        return (
          <Toast nativeID={toastId} action="error" variant="solid">
            <ToastTitle>{getErrorMessage(error)}</ToastTitle>
          </Toast>
        );
      },
    });
  };

  const handleDeletePress = (payableToDelete?: Payable) => {
    const targetPayable = payableToDelete || payable;
    if (!targetPayable) return;

    showPopUpConfirm({
      title: "HAPUS HUTANG",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus hutang ini? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(targetPayable.id),
    });
  };

  const confirmDelete = async (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        hidePopUpConfirm();
        refetch();
        if (payableList.length <= 1) {
            router.back();
        }

        toast.show({
          placement: "top",
          render: ({ id: toastId }) => (
            <Toast nativeID={`toast-${toastId}`} action="success" variant="solid">
              <ToastTitle>Hutang berhasil dihapus</ToastTitle>
            </Toast>
          ),
        });
      },
      onError: (error) => {
        showErrorToast(error);
        hidePopUpConfirm();
      },
    });
  };

  const handleAction = () => {
    showActionDrawer({
      actions: [
        {
          label: "Delete All",
          icon: "TrashBin2",
          theme: "red",
          onPress: () => {
            // Bulk delete logic could go here if needed
            hideActionDrawer();
          },
        },
      ],
    });
  };

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="DETAIL HUTANG"
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Hutang terpilih"
        selectedItemsPosition="right"
        onCancelSelectedItems={() => setSelectedItems([])}
        action={
          <HStack space="sm">
            <Pressable className="p-6" onPress={handleAction}>
              <SolarIconBold
                name="MenuDots"
                size={20}
                color="#FDFBF9"
                style={{ transform: [{ rotate: "90deg" }] }}
              />
            </Pressable>
          </HStack>
        }
        isGoBack
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="md" className="flex-1">
          <VStack className="p-4">
            <HStack
              space="lg"
              className="relative rounded-lg bg-error-100 px-4 pt-4 pb-6 mb-4"
            >
              <VStack className="flex-1">
                <HStack space="md">
                  <SolarIconBoldDuotone
                    name="UserCircle"
                    size={20}
                    color="#3b82f6"
                  />
                  <Text className="text-typography-500 text-sm">
                    {payable?.supplier?.name || 'Unknown Supplier'}
                  </Text>
                </HStack>
                <VStack className="mt-2">
                    <Text className="text-typography-500 text-sm">
                    Total Belum Lunas
                    </Text>
                    <Text className="text-error-500 font-bold">{`Rp ${payableList?.reduce((acc, curr) => acc + (curr.nominal - curr.totalRealization), 0).toLocaleString("id-ID")}`}</Text>
                </VStack>
              </VStack>
              <VStack className="flex-1 items-end">
                <Text className="text-typography-500 text-sm">
                  Jumlah Transaksi Belum Lunas
                </Text>
                <Text className="text-error-500 font-bold">
                  {
                    payableList?.filter((f) => f.totalRealization !== f.nominal)
                      .length
                  }
                </Text>
              </VStack>
              <HStack className="absolute -bottom-4 right-0 left-0 justify-center">
                <Pressable
                  className="items-center justify-center h-9 px-10 rounded-lg bg-primary-500 active:bg-primary-500/90"
                  onPress={() => {
                    router.navigate(
                      `/(main)/management/payable-receivable/payable/detail/${supplierId}/realization/add?payableIds=${payableList?.map((m) => m.id).join("-")}` as any,
                    );
                  }}
                >
                  <Text size="lg" className="text-sm text-white font-bold">
                    LUNASI SEKARANG
                  </Text>
                </Pressable>
              </HStack>
            </HStack>
          </VStack>
        </VStack>
        <VStack space="md" className="px-4 mb-4 mt-4">
          <HStack space="sm" className="items-center">
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => {}}
            >
              <SolarIconLinear name="Sort" size={20} color="#3d2117" />
            </Pressable>
            <>
              <Pressable
                onPress={() => setShowTransactionDatePicker(true)}
                className={`flex-1 border border-background-300 rounded px-3 py-2`}
              >
                <HStack className="items-center justify-between">
                  <Text>
                    {transactionDate instanceof Date
                      ? dayjs(transactionDate).format("DD/MM/YYYY")
                      : "Pilih Tanggal"}
                  </Text>
                  <Icon as={CalendarIcon} size="md" className="mr-2" />
                </HStack>
              </Pressable>
              {showTransactionDatePicker && (
                <DateTimePicker
                  mode="date"
                  value={
                    transactionDate instanceof Date
                      ? transactionDate
                      : new Date()
                  }
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowTransactionDatePicker(false);
                    if (event.type === "set" && selectedDate) {
                      setDueDate(selectedDate);
                    }
                  }}
                />
              )}
            </>
          </HStack>
          <HStack space="sm">
            <Checkbox
              value={statuses.some((s) => s === "Belum Lunas").toString()}
              isChecked={statuses.some((s) => s === "Belum Lunas")}
              size="md"
              onChange={(v) => {
                setStatuses(
                  v
                    ? [...statuses, "Belum Lunas"]
                    : statuses.filter((s) => s !== "Belum Lunas"),
                );
              }}
            >
              <CheckboxIndicator className="w-[16px] h-[16px] border-[1px] rounded-md">
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
              <CheckboxLabel className="text-sm">Belum Lunas</CheckboxLabel>
            </Checkbox>
            <Checkbox
              value={statuses.some((s) => s === "Lunas").toString()}
              isChecked={statuses.some((s) => s === "Lunas")}
              size="md"
              onChange={(v) => {
                setStatuses(
                  v
                    ? [...statuses, "Lunas"]
                    : statuses.filter((s) => s !== "Lunas"),
                );
              }}
            >
              <CheckboxIndicator className="w-[16px] h-[16px] border-[1px] rounded-md">
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
              <CheckboxLabel className="text-sm">Lunas</CheckboxLabel>
            </Checkbox>
          </HStack>
        </VStack>
        <VStack>
          {payableList
            ?.filter((r) =>
              statuses.includes(
                r.nominal - r.totalRealization > 0 ? "Belum Lunas" : "Lunas",
              ),
            )
            ?.map((payable) => (
              <Pressable
                key={payable.id}
                className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                  selectedItems?.some((r) => r.id === payable.id)
                    ? "bg-gray-100"
                    : ""
                }`}
                onPress={() => {
                  if (!!selectedItems?.length) {
                    handlePayablePress(payable);
                  } else {
                    router.navigate(
                      `/(main)/management/payable-receivable/payable/detail/${supplierId}/realization/detail?payableIds=${payable?.id}` as any,
                    );
                    setSelectedItems(null);
                  }
                }}
                onLongPress={() => handlePayablePress(payable)}
              >
                <HStack className="justify-between items-center">
                  <HStack space="md" className="items-center">
                    {!!selectedItems?.length && (
                      <Checkbox
                        value={selectedItems
                          ?.some((r) => r.id === payable.id)
                          .toString()}
                        isChecked={selectedItems?.some(
                          (r) => r.id === payable.id,
                        )}
                        size="md"
                        onChange={() => handlePayablePress(payable)}
                      >
                        <CheckboxIndicator>
                          <CheckboxIcon as={CheckIcon} />
                        </CheckboxIndicator>
                      </Checkbox>
                    )}
                    <VStack>
                      <Heading size="sm">
                        {dayjs(payable.createdAt).format("DD/MM/YYYY")}
                      </Heading>
                      <Text size="xs" className="text-blue-500 font-bold">
                        {`Rp ${payable.nominal.toLocaleString("id-ID")}`}
                      </Text>
                      <Text size="xs" className="text-slate-500">
                        {`JT: ${dayjs(payable.dueDate).format("DD/MM/YYYY")}`}
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack className="items-end">
                    <HStack space="xs" className="items-center">
                      <Box
                        className={`w-2 h-2 rounded-full${payable.totalRealization < payable.nominal ? " bg-red-500" : " bg-green-500"}`}
                      />
                      <Text
                        size="xs"
                        className="text-primary-500 text-sm font-bold"
                      >
                        {payable.totalRealization < payable.nominal
                          ? "Belum Lunas"
                          : "Lunas"}
                      </Text>
                    </HStack>
                    {payable.totalRealization < payable.nominal && (
                      <Text size="xs" className="font-bold text-error-500">
                        {`Rp ${(payable.nominal - payable.totalRealization).toLocaleString("id-ID")}`}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Pressable>
            ))}
          {payableList?.length === 0 && (
            <Box className="p-8 items-center">
              <Text className="text-slate-400 italic">No payable found</Text>
            </Box>
          )}
        </VStack>
      </ScrollView>

      <VStack space="md" className="w-full p-4">
        {!!selectedItems?.length ? (
          <Pressable
            className="w-full rounded-md h-9 flex justify-center items-center bg-primary-500 active:bg-primary-500/90"
            onPress={() => {
              router.navigate(
                `/(main)/management/payable-receivable/payable/detail/${supplierId}/realization/add?payableIds=${selectedItems?.map((m) => m.id).join("-")}` as any,
              );
            }}
          >
            <Text size="sm" className="text-typography-0 font-bold">
              {selectedItems?.length === 1
                ? "BAYAR HUTANG"
                : `BAYAR ${selectedItems?.length} HUTANG`}
            </Text>
          </Pressable>
        ) : (
          <Pressable 
            className="w-full rounded-sm h-9 flex justify-center items-center bg-error-50 border border-error-500"
            onPress={() => {
                router.navigate(`/(main)/management/payable-receivable/payable/add` as any);
            }}
          >
            <Text size="sm" className="text-error-500 font-bold">
              TAMBAH HUTANG
            </Text>
          </Pressable>
        )}
      </VStack>
    </VStack>
  );
}
