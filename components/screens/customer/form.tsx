import Header from "@/components/header";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { getErrorMessage } from "@/lib/api/client";
import {
  useCreateCustomer,
  useCustomer,
  useUpdateCustomer
} from "@/lib/api/customers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronDownIcon } from "lucide-react-native";
import React, { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import z from "zod";

export default function CustomerForm() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const customerId = id;
  const isAdd = !id;

  const customerSchema = z.object({
    name: z.string().min(1, "Nama wajib diisi."),
    code: z.string().min(1, "Kode wajib diisi."),
    category: z.enum(["RETAIL", "WHOLESALE"]),
    phone: z.string(),
    address: z.string(),
  });

  type CustomerFormValues = z.infer<typeof customerSchema>;

  const initialValues: CustomerFormValues = {
    name: "",
    code: "",
    category: "RETAIL",
    phone: "",
    address: "",
  };

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialValues,
  });

  const { data: customer, isLoading: loadingCustomer } = useCustomer(id || "");
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  const categories = [
    { label: "Retail", value: "RETAIL" },
    { label: "Wholesale", value: "WHOLESALE" },
  ];

  useEffect(() => {
    if (customerId && customer) {
      form.reset({
        name: customer.name,
        code: customer.code || "",
        category: customer.category,
        phone: customer.phone || "",
        address: customer.address || "",
      });
    } else {
      form.reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, customerId, form]);

  const showSuccessToast = (message: string) => {
    toast.show({
      placement: "top",
      render: ({ id }) => (
        <Toast nativeID={`toast-${id}`} action="success" variant="solid">
          <ToastTitle>{message}</ToastTitle>
        </Toast>
      ),
    });
  };

  const showErrorToast = (error: unknown) => {
    toast.show({
      placement: "top",
      render: ({ id }) => (
        <Toast nativeID={`toast-${id}`} action="error" variant="solid">
          <ToastTitle>{getErrorMessage(error)}</ToastTitle>
        </Toast>
      ),
    });
  };

  const onSubmit: SubmitHandler<CustomerFormValues> = (
    data: CustomerFormValues
  ) => {
    if (customerId && customer) {
      updateMutation.mutate(
        { ...data, id: customerId },
        {
          onSuccess: () => {
            showSuccessToast("Pelanggan berhasil diperbarui");
            router.back();
          },
          onError: showErrorToast,
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          showSuccessToast("Pelanggan berhasil ditambahkan");
          router.back();
        },
        onError: showErrorToast,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (!isAdd && loadingCustomer) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-white">
      <Header header={isAdd ? "TAMBAH PELANGGAN" : "EDIT PELANGGAN"} isGoBack />
      <ScrollView className="flex-1">
        <VStack space="lg" className="p-4">
          <Controller
            name="name"
            control={form.control}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Nama Pelanggan</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value}
                    autoComplete="name"
                    placeholder="Masukkan nama pelanggan"
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </Input>
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error.message}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />

          <Controller
            name="code"
            control={form.control}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Kode</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value}
                    autoComplete="off"
                    placeholder="Masukkan kode"
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </Input>
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error.message}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />

          <Controller
            control={form.control}
            name="category"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Kategori</FormControlLabelText>
                </FormControlLabel>
                <Select onValueChange={onChange} onBlur={onBlur}>
                  <SelectTrigger>
                    <SelectInput
                      value={
                        categories.find((cat) => cat.value === value)?.label
                      }
                      placeholder="Pilih Kategori"
                      className="flex-1 capitalize"
                    />
                    <SelectIcon className="mr-3" as={ChevronDownIcon} />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent className="px-0">
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      {categories.map((cat) => (
                        <SelectItem
                          key={cat.value}
                          label={cat.label}
                          value={cat.value}
                          textStyle={{ className: "capitalize flex-1" }}
                          className="px-4 py-4"
                        />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error.message}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />

          <Controller
            name="phone"
            control={form.control}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>No Handphone</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value}
                    autoComplete="tel"
                    placeholder="Masukkan no handphone"
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </Input>
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error.message}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />

          <Controller
            name="address"
            control={form.control}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Alamat</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value}
                    autoComplete="address-line1"
                    placeholder="Masukkan alamat"
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </Input>
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error.message}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />
        </VStack>
      </ScrollView>
      <HStack className="w-full p-4">
        <Button
          action="primary"
          onPress={form.handleSubmit(onSubmit)}
          disabled={isLoading}
          className="bg-brand-primary flex-1"
        >
          {isLoading ? (
            <Spinner size="small" color="#FFFFFF" />
          ) : (
            <ButtonText className="text-white">
              {isAdd ? "SIMPAN" : "PERBARUI"}
            </ButtonText>
          )}
        </Button>
      </HStack>
    </Box>
  );
}
