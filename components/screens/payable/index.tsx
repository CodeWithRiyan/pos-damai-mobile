import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  CheckIcon,
  Icon,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  SearchIcon,
} from "@/components/ui";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import {
  SolarIconBold,
  SolarIconBoldDuotone,
  SolarIconLinear,
} from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { getErrorMessage } from "@/lib/api/client";
import {
  PayableBySupplier,
  useBulkDeletePayableBySupplier,
  usePayableList,
} from "@/lib/api/payable";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { CalendarIcon } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView } from "react-native";

export default function PayableList({ isReport }: { isReport?: boolean }) {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  const {
    data: payableBySupplier = [],
    isLoading: isLoadingFetch,
    refetch,
  } = usePayableList();
  const deleteMutation = useBulkDeletePayableBySupplier();

  const isLoading = isLoadingFetch || deleteMutation.isPending;
  const [selectedItems, setSelectedItems] = useState<
    PayableBySupplier[] | null
  >(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [statuses, setStatuses] = useState<string[]>(["Lunas", "Belum Lunas"]);
  const [searchQuery, setSearchQuery] = useState("");

  const toast = useToast();

  const handlePayablePress = (payable: PayableBySupplier) => {
    if (selectedItems?.some((r) => r.supplierId === payable.supplierId)) {
      setSelectedItems(
        selectedItems.filter((r) => r.supplierId !== payable.supplierId),
      );
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

  const handleDeletePress = () => {
    const supplierIds = selectedItems?.map((m) => m.supplierId) || [];

    showPopUpConfirm({
      title: "HAPUS HUTANG",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus `}
          <Text className="font-bold text-slate-900">
            {supplierIds?.length}
          </Text>
          {` hutang? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(supplierIds),
      // loading: deleteMutation.isPending,
    });
  };

  const confirmDelete = async (supplierIds: string[]) => {
    if (!supplierIds.length) return;

    deleteMutation.mutate(supplierIds, {
      onSuccess: () => {
        setSelectedItems(null);
        hidePopUpConfirm();
        refetch();

        toast.show({
          placement: "top",
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
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

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-white">
      <Header
        header={isReport ? "LAPORAN HUTANG" : "HUTANG"}
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Hutang terpilih"
        onCancelSelectedItems={() => setSelectedItems(null)}
        action={
          !isReport && (
            <HStack space="sm" className="w-[72px]">
              {!!selectedItems?.length ? (
                isLoading ? (
                  <Box className="p-6">
                    <Spinner size="small" color="#FFFFFF" />
                  </Box>
                ) : (
                  <Pressable
                    className="p-6"
                    onPress={() => handleDeletePress()}
                  >
                    <SolarIconBold name="TrashBin2" size={20} color="#FDFBF9" />
                  </Pressable>
                )
              ) : (
                <Pressable className="p-6" onPress={() => {}}>
                  <SolarIconBold
                    name="MenuDots"
                    size={20}
                    color="#FDFBF9"
                    style={{ transform: [{ rotate: "90deg" }] }}
                  />
                </Pressable>
              )}
            </HStack>
          )
        }
      />
      <Box className="flex-1 bg-white">
        <VStack className="flex-1">
          <VStack
            space="md"
            className="p-4 shadow-lg bg-background-0 border-b border-background-200"
          >
            <HStack space="sm" className="items-center">
              <Pressable
                className="size-10 items-center justify-center"
                onPress={() => {}}
              >
                <SolarIconLinear name="Filter" size={20} color="#3d2117" />
              </Pressable>
              <Input className="flex-1 border border-background-300 rounded-lg h-10">
                <InputSlot className="pl-3">
                  <InputIcon as={SearchIcon} />
                </InputSlot>
                <InputField
                  placeholder="Cari nama supplier"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </Input>
              <>
                <Pressable
                  onPress={() => setShowDueDatePicker(true)}
                  className={`flex-1 border border-background-300 px-3 h-10 rounded-lg justify-center`}
                >
                  <HStack className="items-center justify-between">
                    <Text>
                      {dueDate instanceof Date
                        ? dayjs(dueDate).format("DD/MM/YYYY")
                        : "Jatuh Tempo"}
                    </Text>
                    <Icon as={CalendarIcon} size="md" className="mr-2" />
                  </HStack>
                </Pressable>
                {showDueDatePicker && (
                  <DateTimePicker
                    mode="date"
                    value={dueDate instanceof Date ? dueDate : new Date()}
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDueDatePicker(false);
                      if (event.type === "set" && selectedDate) {
                        setDueDate(selectedDate);
                      }
                    }}
                  />
                )}
              </>
            </HStack>
            <HStack space="lg" className="rounded-lg bg-error-100 p-4">
              <SolarIconBoldDuotone name="Card" size={40} color="#ef4444" />
              <VStack className="flex-1">
                <Text className="text-typography-500 text-sm">
                  Total Belum Lunas
                </Text>
                <Heading size="xl" className="text-error-500">
                  {`Rp ${payableBySupplier
                    .reduce(
                      (acc, curr) =>
                        acc + (curr.totalPayable - curr.totalRealization),
                      0,
                    )
                    .toLocaleString("id-ID")}`}
                </Heading>
              </VStack>
              <VStack className="flex-1 items-end">
                <Text className="text-typography-500 text-sm">
                  Jumlah Transaksi Belum Lunas
                </Text>
                <Text className="text-error-500 font-bold">
                  {
                    payableBySupplier.filter(
                      (f) => f.totalRealization !== f.totalPayable,
                    ).length
                  }
                </Text>
              </VStack>
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
          <ScrollView className="flex-1">
            <VStack>
              {payableBySupplier
                ?.filter((r) =>
                  statuses.includes(
                    r.totalPayable - r.totalRealization > 0
                      ? "Belum Lunas"
                      : "Lunas",
                  ),
                )
                ?.filter((r) =>
                  r.supplierName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
                )
                ?.map((payable) => (
                  <Pressable
                    key={payable.supplierId}
                    className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                      selectedItems?.some(
                        (r) => r.supplierId === payable.supplierId,
                      )
                        ? "bg-gray-100"
                        : ""
                    }`}
                    onPress={() => {
                      if (!!selectedItems?.length) {
                        handlePayablePress(payable);
                      } else {
                        router.navigate(
                          `/(main)/management/payable-receivable/payable/detail/${payable.supplierId}` as any,
                        );
                        setSelectedItems(null);
                        console.log(
                          `/(main)/management/payable-receivable/payable/detail/${payable.supplierId}`,
                        );
                      }
                    }}
                    onLongPress={() => !isReport && handlePayablePress(payable)}
                  >
                    <HStack className="justify-between items-center">
                      <HStack space="md" className="items-center">
                        <Box className="w-10 h-10 rounded-md bg-brand-secondary/20 items-center justify-center">
                          <Text className="text-brand-primary font-bold">
                            {payable.supplierName.substring(0, 1).toUpperCase()}
                          </Text>
                        </Box>
                        <VStack>
                          <Heading size="sm">{payable.supplierName}</Heading>
                          <Text size="xs" className="text-slate-500">
                            {dayjs(payable.nearestDueDate).format("DD/MM/YYYY")}
                          </Text>
                          <Text size="xs" className="text-blue-500">
                            {`Rp ${payable.totalPayable.toLocaleString("id-ID")}`}
                          </Text>
                        </VStack>
                      </HStack>
                      <VStack className="items-end">
                        <HStack space="xs" className="items-center">
                          <Box
                            className={`w-2 h-2 rounded-full${payable.totalRealization < payable.totalPayable ? " bg-red-500" : " bg-green-500"}`}
                          />
                          <Text
                            size="xs"
                            className="text-brand-primary text-sm font-bold"
                          >
                            {payable.totalRealization < payable.totalPayable
                              ? "Belum Lunas"
                              : "Lunas"}
                          </Text>
                        </HStack>
                        {payable.totalRealization < payable.totalPayable && (
                          <Text size="xs" className="font-bold text-error-500">
                            {`Rp ${(payable.totalPayable - payable.totalRealization).toLocaleString("id-ID")}`}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Pressable>
                ))}
              {payableBySupplier?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">
                    No payable found
                  </Text>
                </Box>
              )}
            </VStack>
          </ScrollView>
        </VStack>
      </Box>
    </Box>
  );
}
