import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import {
  Button,
  ButtonText,
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
import { User } from "@/lib/api/users";
import { PaymentType } from "@/stores/payment-type";
// import { useBulkDeleteReceivable, Receivable, useReceivableList } from "@/lib/api/receivable";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { CalendarIcon } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView } from "react-native";

export interface ReceivableRealization {
  id: string;
  ref: string;
  nominal: number;
  realizationDate: string;
  paymentTypeId: string;
  paymentType: PaymentType;
  note: string;
  createdAt: string;
  createdById: string;
  createdByName: string;
}

export interface Receivable {
  id: string;
  userId: string;
  user: User;
  dueDate: string;
  nominal: number;
  totalRealization: number;
  realizations: ReceivableRealization[];
  createdAt: string;
}

export interface ReceivableByUser {
  userId: string;
  userName: string;
  totalReceivable: number;
  totalRealization: number;
  nearestDueDate: string;
  organizationId: string;
  address: string;
  phone: string;
}

export const dataReceivable: Receivable[] = [
  {
    id: "1",
    userId: "1",
    user: {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      email: "DjC3Y@example.com",
      phone: "08123456789",
      password: "",
      avatar: "",
      provider: "",
      isActive: true,
      isLocked: false,
      lockReason: "",
      selectedOrganizationId: "1",
      createdById: "1",
      lastLoginAt: "2023-01-01",
      passwordChangedAt: "2023-01-01",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-01",
      username: "johndoe",
      roles: [] as any,
    },
    dueDate: "2023-01-01",
    nominal: 10000,
    totalRealization: 5000,
    realizations: [
      {
        id: "1",
        ref: "123JB1JK3JK12",
        nominal: 5000,
        realizationDate: "2023-01-01",
        paymentTypeId: "1",
        paymentType: {
          id: "1",
          name: "Cash",
          commission: 0,
          minimalAmount: 0,
        },
        note: "Realisasi 1",
        createdAt: "2023-01-01",
        createdById: "1",
        createdByName: "John Doe",
      },
    ],
    createdAt: "2023-01-01",
  },
  {
    id: "2",
    userId: "2",
    user: {
      id: "2",
      firstName: "Jane",
      lastName: "Doe",
      email: "DjC3Y@ex.com",
      phone: "08123456788",
      password: "",
      avatar: "",
      provider: "",
      isActive: true,
      isLocked: false,
      lockReason: "",
      selectedOrganizationId: "1",
      createdById: "1",
      lastLoginAt: "2023-01-01",
      passwordChangedAt: "2023-01-01",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-01",
      username: "janedoe",
      roles: [] as any,
    },
    dueDate: "2023-01-01",
    nominal: 20000,
    totalRealization: 0,
    realizations: [],
    createdAt: "2023-01-01",
  },
  {
    id: "3",
    userId: "1",
    user: {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      email: "DjC3Y@example.com",
      phone: "08123456789",
      password: "",
      avatar: "",
      provider: "",
      isActive: true,
      isLocked: false,
      lockReason: "",
      selectedOrganizationId: "1",
      createdById: "1",
      lastLoginAt: "2023-01-01",
      passwordChangedAt: "2023-01-01",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-01",
      username: "johndoe",
      roles: [] as any,
    },
    dueDate: "2023-01-01",
    nominal: 10000,
    totalRealization: 5000,
    realizations: [
      {
        id: "1",
        ref: "123JB1JK3JK12",
        nominal: 5000,
        realizationDate: "2023-01-01",
        paymentTypeId: "1",
        paymentType: {
          id: "1",
          name: "Cash",
          commission: 0,
          minimalAmount: 0,
        },
        note: "Realisasi 1",
        createdAt: "2023-01-01",
        createdById: "1",
        createdByName: "John Doe",
      },
    ],
    createdAt: "2023-01-01",
  },
];

export const receivableByUser: ReceivableByUser[] = [
  {
    userId: "1",
    userName: "John Doe",
    totalReceivable: 20000,
    totalRealization: 10000,
    nearestDueDate: "2023-01-01",
    organizationId: "1",
    address: "Jalan 1",
    phone: "08123456789",
  },
  {
    userId: "2",
    userName: "Jane Doe",
    totalReceivable: 20000,
    totalRealization: 0,
    nearestDueDate: "2023-01-01",
    organizationId: "1",
    address: "Jalan 1",
    phone: "08123456789",
  },
];

export default function ReceivableList() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  // const { data, isLoadingFetch, refetch } = useReceivableList();
  // const deleteMutation = useBulkDeleteReceivable();

  const isLoading = false; // isLoadingFetch || deleteMutation.isLoading;
  const [selectedItems, setSelectedItems] = useState<ReceivableByUser[] | null>(
    null,
  );
  const [showDueDatePicker, setShowDueDatePicker] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [statuses, setStatuses] = useState<string[]>(["Lunas", "Belum Lunas"]);

  const toast = useToast();

  const handleReceivablePress = (receivable: ReceivableByUser) => {
    if (selectedItems?.some((r) => r.userId === receivable.userId)) {
      setSelectedItems(
        selectedItems.filter((r) => r.userId !== receivable.userId),
      );
      return;
    }
    if (!selectedItems) {
      setSelectedItems([receivable]);
      return;
    }

    setSelectedItems([...selectedItems, receivable]);
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

  const handleAdd = () => {
    setSelectedItems(null);
    router.push("/(main)/management/payable-receivable/receivable/add");
  };

  const handleDeletePress = () => {
    const userIds = selectedItems?.map((m) => m.userId) || [];

    showPopUpConfirm({
      title: "HAPUS PIUTANG",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus `}
          <Text className="font-bold text-slate-900">{userIds?.length}</Text>
          {` piutang? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(userIds),
      // loading: deleteMutation.isPending,
    });
  };

  const confirmDelete = async (userIds: string[]) => {
    if (!userIds.length) return;
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
        header="PIUTANG"
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Piutang terpilih"
        onCancelSelectedItems={() => setSelectedItems(null)}
        action={
          <HStack space="sm" className="w-[72px]">
            {!!selectedItems?.length ? (
              isLoading ? (
                <Box className="p-6">
                  <Spinner size="small" color="#FFFFFF" />
                </Box>
              ) : (
                <Pressable className="p-6" onPress={() => handleDeletePress()}>
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
                <InputField placeholder="Cari nama user" />
              </Input>
              <>
                <Pressable
                  onPress={() => setShowDueDatePicker(true)}
                  className={`flex-1 border border-background-300 rounded px-3 py-2`}
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
                  Rp 1.000.000
                </Heading>
              </VStack>
              <VStack className="flex-1 items-end">
                <Text className="text-typography-500 text-sm">
                  Jumlah Transaksi Belum Lunas
                </Text>
                <Text className="text-error-500 font-bold">
                  {
                    receivableByUser.filter(
                      (f) => f.totalRealization !== f.totalReceivable,
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
              {receivableByUser
                ?.filter((r) =>
                  statuses.includes(
                    r.totalReceivable - r.totalRealization > 0
                      ? "Belum Lunas"
                      : "Lunas",
                  ),
                )
                ?.map((receivable) => (
                  <Pressable
                    key={receivable.userId}
                    className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                      selectedItems?.some((r) => r.userId === receivable.userId)
                        ? "bg-gray-100"
                        : ""
                    }`}
                    onPress={() => {
                      if (!!selectedItems?.length) {
                        handleReceivablePress(receivable);
                      } else {
                        router.navigate(
                          `/(main)/management/payable-receivable/receivable/detail/${receivable.userId}`,
                        );
                        setSelectedItems(null);
                        console.log(
                          `/(main)/management/payable-receivable/receivable/detail/${receivable.userId}`,
                        );
                      }
                    }}
                    onLongPress={() => handleReceivablePress(receivable)}
                  >
                    <HStack className="justify-between items-center">
                      <HStack space="md" className="items-center">
                        <Box className="w-10 h-10 rounded-md bg-brand-secondary/20 items-center justify-center">
                          <Text className="text-brand-primary font-bold">
                            {receivable.userName.substring(0, 1).toUpperCase()}
                          </Text>
                        </Box>
                        <VStack>
                          <Heading size="sm">{receivable.userName}</Heading>
                          <Text size="xs" className="text-slate-500">
                            {dayjs(receivable.nearestDueDate).format(
                              "DD/MM/YYYY",
                            )}
                          </Text>
                          <Text size="xs" className="text-blue-500">
                            {`Rp ${receivable.totalReceivable.toLocaleString("id-ID")}`}
                          </Text>
                        </VStack>
                      </HStack>
                      <VStack className="items-end">
                        <HStack space="xs" className="items-center">
                          <Box
                            className={`w-2 h-2 rounded-full${receivable.totalRealization < receivable.totalReceivable ? " bg-red-500" : " bg-green-500"}`}
                          />
                          <Text
                            size="xs"
                            className="text-brand-primary text-sm font-bold"
                          >
                            {receivable.totalRealization <
                            receivable.totalReceivable
                              ? "Belum Lunas"
                              : "Lunas"}
                          </Text>
                        </HStack>
                        {receivable.totalRealization <
                          receivable.totalReceivable && (
                          <Text size="xs" className="font-bold text-error-500">
                            {`Rp ${(receivable.totalReceivable - receivable.totalRealization).toLocaleString("id-ID")}`}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Pressable>
                ))}
              {receivableByUser?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">
                    No receivable found
                  </Text>
                </Box>
              )}
            </VStack>
          </ScrollView>
          <HStack className="w-full p-4">
            <Button
              size="sm"
              className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
              onPress={handleAdd}
            >
              <ButtonText className="text-white">TAMBAH PIUTANG</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
