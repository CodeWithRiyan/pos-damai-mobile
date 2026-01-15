import Header from "@/components/header";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { getErrorMessage } from "@/lib/api/client";
import { useCategory, useCreateCategory, useUpdateCategory } from "@/lib/api/categories";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";

interface CategoryFormProps {
  mode: "add" | "edit";
}

export default function CategoryForm({ mode }: CategoryFormProps) {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;

  const { data: existingCategory, isLoading: loadingCategory } = useCategory(id || "");
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const [name, setName] = useState("");
  const [point, setPoint] = useState("0");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (existingCategory && mode === "edit") {
      setName(existingCategory.name);
      setPoint(String(existingCategory.point));
      setDescription(existingCategory.description || "");
    }
  }, [existingCategory, mode]);

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
      showErrorToast("Nama kategori wajib diisi");
      return;
    }

    const data = {
      name: name.trim(),
      point: parseFloat(point) || 0,
      description: description.trim() || undefined,
    };

    if (mode === "edit" && id) {
      updateMutation.mutate(
        { id, ...data },
        {
          onSuccess: () => {
            showSuccessToast("Kategori berhasil diperbarui");
            router.back();
          },
          onError: showErrorToast,
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          showSuccessToast("Kategori berhasil ditambahkan");
          router.back();
        },
        onError: showErrorToast,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (mode === "edit" && loadingCategory) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-white">
      <Header header={mode === "add" ? "TAMBAH KATEGORI" : "EDIT KATEGORI"} isGoBack />
      <ScrollView className="flex-1">
        <VStack space="lg" className="p-4">
          <FormControl isRequired>
            <FormControlLabel>
              <FormControlLabelText>Nama Kategori</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                placeholder="Masukkan nama kategori"
                value={name}
                onChangeText={setName}
              />
            </Input>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Poin</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                placeholder="0"
                value={point}
                onChangeText={setPoint}
                keyboardType="numeric"
              />
            </Input>
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
