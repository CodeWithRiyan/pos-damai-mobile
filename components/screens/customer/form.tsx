import Header from "@/components/header";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Select, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { getErrorMessage } from "@/lib/api/client";
import { CustomerCategory, useCustomer, useCreateCustomer, useUpdateCustomer } from "@/lib/api/customers";
import { ChevronDownIcon } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";

interface CustomerFormProps {
  mode: "add" | "edit";
}

export default function CustomerForm({ mode }: CustomerFormProps) {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;

  const { data: existingCustomer, isLoading: loadingCustomer } = useCustomer(id || "");
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<CustomerCategory>("RETAIL");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (existingCustomer && mode === "edit") {
      setName(existingCustomer.name);
      setCode(existingCustomer.code || "");
      setCategory(existingCustomer.category);
      setPhone(existingCustomer.phone || "");
      setAddress(existingCustomer.address || "");
    }
  }, [existingCustomer, mode]);

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

  const handleSubmit = () => {
    if (!name.trim()) {
      showErrorToast("Nama pelanggan wajib diisi");
      return;
    }

    const data = {
      name: name.trim(),
      code: code.trim() || undefined,
      category,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
    };

    if (mode === "edit" && id) {
      updateMutation.mutate(
        { id, ...data },
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

  if (mode === "edit" && loadingCustomer) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-white">
      <Header header={mode === "add" ? "TAMBAH PELANGGAN" : "EDIT PELANGGAN"} isGoBack />
      <ScrollView className="flex-1">
        <VStack space="lg" className="p-4">
          <FormControl isRequired>
            <FormControlLabel>
              <FormControlLabelText>Nama Pelanggan</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                placeholder="Masukkan nama pelanggan"
                value={name}
                onChangeText={setName}
              />
            </Input>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Kode</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                placeholder="Masukkan kode (opsional)"
                value={code}
                onChangeText={setCode}
              />
            </Input>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Kategori</FormControlLabelText>
            </FormControlLabel>
            <Select 
              selectedValue={category} 
              onValueChange={(val) => setCategory(val as CustomerCategory)}
            >
              <SelectTrigger>
                <SelectInput placeholder="Pilih kategori" />
                <SelectIcon className="mr-3" as={ChevronDownIcon} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  <SelectItem label="Retail" value="RETAIL" />
                  <SelectItem label="Grosir (Wholesale)" value="WHOLESALE" />
                </SelectContent>
              </SelectPortal>
            </Select>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Nomor Telepon</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                placeholder="Masukkan nomor telepon (opsional)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </Input>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Alamat</FormControlLabelText>
            </FormControlLabel>
            <Textarea>
              <TextareaInput
                placeholder="Masukkan alamat (opsional)"
                value={address}
                onChangeText={setAddress}
              />
            </Textarea>
          </FormControl>
        </VStack>
      </ScrollView>
      <HStack className="w-full p-4">
        <Button
          size="sm"
          className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <Spinner size="small" color="#FFFFFF" />
          ) : (
            <ButtonText className="text-white">
              {mode === "add" ? "SIMPAN" : "PERBARUI"}
            </ButtonText>
          )}
        </Button>
      </HStack>
    </Box>
  );
}
