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
import { useBrands } from "@/lib/api/brands";
import { useCategories } from "@/lib/api/categories";
import { useProduct, useCreateProduct, useUpdateProduct } from "@/lib/api/products";
import { ChevronDownIcon } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";

interface ProductFormProps {
  mode: "add" | "edit";
}

export default function ProductForm({ mode }: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;

  const { data: existingProduct, isLoading: loadingProduct } = useProduct(id || "");
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("0");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");

  useEffect(() => {
    if (existingProduct && mode === "edit") {
      setName(existingProduct.name);
      setBarcode(existingProduct.barcode || "");
      setPurchasePrice(String(existingProduct.purchasePrice));
      setDescription(existingProduct.description || "");
      setCategoryId(existingProduct.categoryId);
      setBrandId(existingProduct.brandId || "");
    }
  }, [existingProduct, mode]);

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
      showErrorToast("Nama produk wajib diisi");
      return;
    }
    if (!categoryId) {
      showErrorToast("Kategori wajib dipilih");
      return;
    }

    const data = {
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      purchasePrice: parseFloat(purchasePrice) || 0,
      description: description.trim() || undefined,
      categoryId,
      brandId: brandId || undefined,
    };

    if (mode === "edit" && id) {
      updateMutation.mutate(
        { id, ...data },
        {
          onSuccess: () => {
            showSuccessToast("Produk berhasil diperbarui");
            router.back();
          },
          onError: showErrorToast,
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          showSuccessToast("Produk berhasil ditambahkan");
          router.back();
        },
        onError: showErrorToast,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (mode === "edit" && loadingProduct) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-white">
      <Header header={mode === "add" ? "TAMBAH PRODUK" : "EDIT PRODUK"} isGoBack />
      <ScrollView className="flex-1">
        <VStack space="lg" className="p-4">
          <FormControl isRequired>
            <FormControlLabel>
              <FormControlLabelText>Nama Produk</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                placeholder="Masukkan nama produk"
                value={name}
                onChangeText={setName}
              />
            </Input>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Barcode</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                placeholder="Masukkan barcode (opsional)"
                value={barcode}
                onChangeText={setBarcode}
              />
            </Input>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Harga Beli</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                placeholder="0"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                keyboardType="numeric"
              />
            </Input>
          </FormControl>

          <FormControl isRequired>
            <FormControlLabel>
              <FormControlLabelText>Kategori</FormControlLabelText>
            </FormControlLabel>
            <Select selectedValue={categoryId} onValueChange={setCategoryId}>
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
                  {(categories || []).map((cat) => (
                    <SelectItem key={cat.id} label={cat.name} value={cat.id} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Brand</FormControlLabelText>
            </FormControlLabel>
            <Select selectedValue={brandId} onValueChange={setBrandId}>
              <SelectTrigger>
                <SelectInput placeholder="Pilih brand (opsional)" />
                <SelectIcon className="mr-3" as={ChevronDownIcon} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  <SelectItem label="-- Tidak Ada --" value="" />
                  {(brands || []).map((brand) => (
                    <SelectItem key={brand.id} label={brand.name} value={brand.id} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Deskripsi</FormControlLabelText>
            </FormControlLabel>
            <Textarea>
              <TextareaInput
                placeholder="Masukkan deskripsi (opsional)"
                value={description}
                onChangeText={setDescription}
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
