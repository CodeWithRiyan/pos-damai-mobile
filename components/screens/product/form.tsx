import BarcodeScanner from "@/components/barcode-scanner";
import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import {
  Button,
  ButtonText,
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  HStack,
  Icon,
  Input,
  InputField,
  Pressable,
  Spinner,
  Switch,
  Text,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
import { Grid, GridItem } from "@/components/ui/grid";
import SelectModal from "@/components/ui/select/select-modal";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { useBrands } from "@/lib/api/brands";
import { useCategories } from "@/lib/api/categories";
import { getErrorMessage } from "@/lib/api/client";
import { Discount, useDeleteDiscount, useDiscounts } from "@/lib/api/discounts";
import {
  CreateProductDTO,
  UpdateProductDTO,
  useCreateProduct,
  useProduct,
  useProducts,
  useUpdateProduct,
} from "@/lib/api/products";
import { unitSuffixHelper } from "@/lib/unit";
import { useBrandStore } from "@/stores/brand";
import { useCategoryStore } from "@/stores/category";
import { useDiscountStore } from "@/stores/discount";
import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PlusIcon, ScanBarcode } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Controller,
  SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";

export default function ProductForm() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const { setOpen: setOpenCategory, setData: setDataCategory } =
    useCategoryStore();
  const { setOpen: setOpenBrand, setData: setDataBrand } = useBrandStore();
  const { setOpen: setOpenDiscount, setData: setDataDiscount } =
    useDiscountStore();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isAdd = !id;
  const productId = id as string;

  const [scanBarcodePosition, setScanBarcodePosition] = useState<string | null>(
    null,
  );

  const productSchema = z
    .object({
      name: z.string().min(1, "Nama wajib diisi."),
      code: z.string().min(1, "Kode wajib diisi."),
      type: z.string().min(1, "Type wajib diisi."),
      unit: z.string().nullable(),
      categoryId: z.string(),
      brandId: z.string(),
      purchasePrice: z.number().min(1, "Harga Beli wajib diisi."),
      stock: z.number(),
      minimumStock: z.number(),
      unitVariants: z
        .array(
          z.object({
            code: z.string(),
            netto: z.number().min(0.001, "Netto wajib diisi."),
            purchasePrice: z.number(),
            retailPrice: z.number(),
          }),
        )
        .nullable(),
      variants: z
        .array(
          z.object({
            code: z.string().min(1, "Kode wajib diisi."),
          }),
        )
        .nullable(),
      retailPrice: z.array(
        z.object({
          minimumPurchase: z.number().min(0, "Minimal Pembelian wajib diisi."),
          price: z.number().min(0, "Harga wajib diisi."),
        }),
      ),
      wholesalePrice: z.array(
        z.object({
          minimumPurchase: z.number().min(0, "Minimal Pembelian wajib diisi."),
          price: z.number().min(0, "Harga wajib diisi."),
        }),
      ),
      discountId: z.string().optional().nullable(),
      isActive: z.boolean(),
      description: z.string(),
    })
    .superRefine((data, ctx) => {
      // Validasi khusus type MULTIUNIT
      if (data.type === "MULTIUNIT") {
        if (!data.unit) {
          ctx.addIssue({
            code: "custom",
            message: "Satuan wajib diisi.",
            path: ["unit"],
          });
        }
        if (!data.unitVariants || data.unitVariants.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: "Varian Unit wajib diisi.",
            path: ["unitVariants"],
          });
        }
        // Validasi harga retail unit variant tidak boleh kurang dari harga beli
        data.unitVariants?.forEach((variant, i) => {
          if (!variant.code) {
            ctx.addIssue({
              code: "custom",
              message: "Kode wajib diisi",
              path: [`unitVariants.${i}.code`],
            });
          }
          if (!variant.retailPrice) {
            ctx.addIssue({
              code: "custom",
              message: "Harga Retail wajib diisi",
              path: [`unitVariants.${i}.retailPrice`],
            });
          }
          if (variant.retailPrice < variant.purchasePrice) {
            ctx.addIssue({
              code: "custom",
              message: "Harga Retail tidak boleh kurang dari harga beli",
              path: [`unitVariants.${i}.retailPrice`],
            });
          }
          // Cek duplikat: apakah nilai netto ini muncul lebih dari sekali
          const nettoValues = data.unitVariants?.map((v) => v.netto) ?? [];
          const isDuplicate =
            nettoValues.filter((n) => n === variant.netto).length > 1;
          if (isDuplicate) {
            ctx.addIssue({
              code: "custom",
              message: "Netto tidak boleh ada yang sama",
              path: [`unitVariants.${i}.netto`],
            });
          }
        });
      }

      // Validasi khusus type VARIANTS
      if (data.type === "VARIANTS") {
        if (!data.variants || data.variants.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: "Varian Produk wajib diisi.",
            path: ["variants"],
          });
        }
      }

      if (data.type !== "MULTIUNIT") {
        // Validasi retail price wajib diisi jika bukan MULTIUNIT
        if (data.retailPrice.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: "Harga Retail wajib diisi.",
            path: ["retailPrice"],
          });
        }

        // Validasi detail harga retail
        data.retailPrice.forEach((dataRetail, i) => {
          if (dataRetail.minimumPurchase < 0.001) {
            ctx.addIssue({
              code: "custom",
              message: "Minimal Pembelian wajib diisi.",
              path: [`retailPrice.${i}.minimumPurchase`],
            });
          }
          if (dataRetail.price < 1) {
            ctx.addIssue({
              code: "custom",
              message: "Harga wajib diisi.",
              path: [`retailPrice.${i}.price`],
            });
          }
          if (dataRetail.price < data.purchasePrice) {
            ctx.addIssue({
              code: "custom",
              message: "Harga Retail tidak boleh kurang dari harga beli",
              path: [`retailPrice.${i}.price`],
            });
          }
        });

        // Validasi detail harga grosir
        data.wholesalePrice.forEach((dataWholesale, i) => {
          if (dataWholesale.minimumPurchase < 0.001) {
            ctx.addIssue({
              code: "custom",
              message: "Minimal Pembelian wajib diisi.",
              path: [`wholesalePrice.${i}.minimumPurchase`],
            });
          }
          if (dataWholesale.price < 1) {
            ctx.addIssue({
              code: "custom",
              message: "Harga wajib diisi.",
              path: [`wholesalePrice.${i}.price`],
            });
          }
          if (dataWholesale.price < data.purchasePrice) {
            ctx.addIssue({
              code: "custom",
              message: "Harga Grosir tidak boleh kurang dari harga beli",
              path: [`wholesalePrice.${i}.price`],
            });
          }
        });
      }
    });

  type ProductFormValues = z.infer<typeof productSchema>;

  const initialValues: ProductFormValues = {
    name: "",
    code: "",
    type: "DEFAULT",
    unit: null,
    categoryId: "",
    brandId: "",
    purchasePrice: 0,
    stock: 0,
    minimumStock: 0,
    unitVariants: [
      {
        code: "",
        netto: 1,
        purchasePrice: 0,
        retailPrice: 0,
      },
    ],
    variants: null,
    retailPrice: [
      {
        minimumPurchase: 1,
        price: 0,
      },
    ],
    wholesalePrice: [],
    discountId: "",
    description: "",
    isActive: true,
  };

  const [nettoInput, setNettoInput] = useState<
    { index: number; netto: string }[]
  >([]);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialValues,
  });

  const purchasePrice = form.watch("purchasePrice");
  const unit = form.watch("unit");

  const {
    fields: unitVariantFields,
    append: unitVariantAppend,
    remove: unitVariantRemove,
  } = useFieldArray({
    control: form.control,
    name: "unitVariants",
  });

  const {
    fields: variantFields,
    append: variantAppend,
    remove: variantRemove,
  } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const {
    fields: retailFields,
    append: retailAppend,
    remove: retailRemove,
  } = useFieldArray({
    control: form.control,
    name: "retailPrice",
  });

  const {
    fields: wholesaleFields,
    append: wholesaleAppend,
    remove: wholesaleRemove,
  } = useFieldArray({
    control: form.control,
    name: "wholesalePrice",
  });

  const { refetch: refetchProducts } = useProducts();
  const { data: product, refetch: refetchProduct } = useProduct(
    productId || "",
  );
  const { data: categories = [], refetch: refetchCategories } = useCategories();
  const { data: brands = [], refetch: refetchBrands } = useBrands();
  const { data: discounts = [], refetch: refetchDiscounts } = useDiscounts();
  const deleteDiscountMutation = useDeleteDiscount();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const isLoading = createMutation.isPending || updateMutation.isPending;
  const toast = useToast();

  const productTypeOptions = [
    { label: "DEFAULT", value: "DEFAULT" },
    { label: "MULTIUNIT", value: "MULTIUNIT" },
    { label: "VARIAN", value: "VARIANTS" },
  ];

  const productUnitOptions = [
    { label: "KILOGRAM", value: "KILOGRAM" },
    { label: "LITER", value: "LITER" },
  ];

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

  useEffect(() => {
    setNettoInput(
      unitVariantFields.map((field, index) => ({
        index,
        netto: (field.netto ?? 0).toString(),
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitVariantFields.length]);

  useEffect(() => {
    if (productId && product) {
      form.reset({
        name: product.name,
        code: product.code || "",
        type: product.type,
        unit: product.unit,
        categoryId: product.categoryId || "",
        brandId: product.brandId || "",
        purchasePrice: product.purchasePrice,
        stock: product.stock,
        minimumStock: product.minimumStock,
        variants: product.type === "VARIANTS" ? product.variants : null,
        unitVariants:
          product.type === "MULTIUNIT"
            ? product.variants?.map((v) => {
                const matchingPrice = product.sellPrices.find(
                  (p) => p.label === v.name,
                );

                return {
                  code: v.code,
                  netto: v.netto || 0,
                  purchasePrice: product.purchasePrice * (v.netto || 0),
                  retailPrice: matchingPrice?.price || 0,
                  minimumPurchase: matchingPrice?.minimumPurchase || 0,
                };
              })
            : null,
        retailPrice: product.sellPrices.filter((r: any) => r.type === "RETAIL"),
        wholesalePrice: product.sellPrices.filter(
          (r: any) => r.type === "WHOLESALE",
        ),
        discountId: product.discountId || "",
        isActive: product.isActive,
        description: product.description || "",
      });
    } else {
      form.reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, product, productId]);

  const onRefetch = () => {
    refetchProducts();
    refetchCategories();
    refetchBrands();
    refetchDiscounts();
    if (productId) {
      refetchProduct();
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleDeletePress = (discount: Discount) => {
    showPopUpConfirm({
      title: "HAPUS DISKON",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus diskon `}
          <Text className="font-bold text-slate-900">{discount?.name}</Text>
          {` ? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(discount),
      loading: deleteDiscountMutation.isPending,
    });
  };

  const confirmDelete = async (discount: Discount) => {
    deleteDiscountMutation.mutate(discount.id, {
      onSuccess: () => {
        hidePopUpConfirm();
        onRefetch();

        toast.show({
          placement: "top",
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Diskon berhasil dihapus</ToastTitle>
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

  const onSubmit: SubmitHandler<ProductFormValues> = (
    data: ProductFormValues,
  ) => {
    const prices =
      data.type === "MULTIUNIT"
        ? [
            ...(data.unitVariants || [])
              .sort((a, b) => b.retailPrice - a.retailPrice)
              .map((uv) => ({
                type: "RETAIL" as const,
                label: `${uv.netto} ${unitSuffixHelper(data.unit)}`,
                price: uv.retailPrice,
                minimumPurchase: 1,
              })),
            ...data.wholesalePrice
              .sort((a, b) => b.price - a.price)
              .map((p) => ({
                ...p,
                type: "WHOLESALE" as const,
                label: "Grosir",
              })),
          ]
        : [
            ...data.retailPrice
              .sort((a, b) => b.price - a.price)
              .map((p) => ({
                ...p,
                type: "RETAIL" as const,
                label: "Retail",
              })),
            ...data.wholesalePrice
              .sort((a, b) => b.price - a.price)
              .map((p) => ({
                ...p,
                type: "WHOLESALE" as const,
                label: "Grosir",
              })),
          ];

    const variantsPayload =
      data.type === "MULTIUNIT"
        ? (data.unitVariants || [])
            .sort((a, b) => {
              if (a.netto === 1) return -1; // a selalu di atas jika netto = 1
              if (b.netto === 1) return 1; // b selalu di atas jika netto = 1
              return b.netto - a.netto; // sisanya descending (5, 0.25, dst)
            })
            .map((uv) => ({
              name: `${uv.netto} ${unitSuffixHelper(data.unit)}`,
              code: uv.code,
              netto: uv.netto,
            }))
        : data.variants?.map((v) => ({
            name: `${data.name} - ${v.code}`,
            code: v.code,
          })) || [];

    if (productId && product) {
      const updateData: UpdateProductDTO = {
        ...data,
        type: data.type as any,
        id: product.id,
        prices,
        variants: variantsPayload,
      };
      updateMutation.mutate(updateData, {
        onSuccess: () => {
          onRefetch();
          handleCancel();
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Produk berhasil diubah</ToastTitle>
              </Toast>
            ),
          });
        },
        onError: (error) => {
          showErrorToast(error);
        },
      });
    } else {
      const createData: CreateProductDTO = {
        ...data,
        type: data.type as any,
        prices,
        variants: variantsPayload,
      };
      createMutation.mutate(createData, {
        onSuccess: () => {
          onRefetch();
          form.reset(initialValues);
          handleCancel();
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Produk berhasil ditambahkan</ToastTitle>
              </Toast>
            ),
          });
        },
        onError: (error) => {
          showErrorToast(error);
        },
      });
    }
  };

  const selectedType = form.watch("type");

  return (
    <VStack className="flex-1 bg-white">
      <Header header={isAdd ? "TAMBAH PRODUK " : "EDIT PRODUK "} isGoBack />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
                  <FormControlLabelText>Nama</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value}
                    autoComplete="name"
                    placeholder="Masukkan nama"
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
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Kode</FormControlLabelText>
                </FormControlLabel>
                <HStack space="md">
                  <Input className="flex-1">
                    <InputField
                      value={value}
                      autoComplete="name"
                      placeholder="Masukkan Kode"
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  </Input>
                  <Pressable
                    className={classNames(
                      "size-10 rounded-md bg-white border border-primary-500 items-center justify-center",
                      scanBarcodePosition === "code" && "bg-primary-500",
                    )}
                    onPress={() => {
                      if (scanBarcodePosition === "code") {
                        setScanBarcodePosition(null);
                      } else {
                        setScanBarcodePosition("code");
                      }
                    }}
                  >
                    <Icon
                      as={ScanBarcode}
                      color={
                        scanBarcodePosition === "code" ? "#fff" : "#3d2117"
                      }
                    />
                  </Pressable>
                </HStack>
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
            name="isActive"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl
                isInvalid={!!error}
                className="flex-row gap-4 items-center border border-background-300 px-4 rounded-md w-full"
              >
                <FormControlLabel className="mb-0 flex-1">
                  <FormControlLabelText>
                    Tampilkan di transaksi
                  </FormControlLabelText>
                </FormControlLabel>
                <Switch
                  size="md"
                  value={value}
                  onValueChange={onChange}
                  onBlur={onBlur}
                  className="border-none"
                />
              </FormControl>
            )}
          />
          <Controller
            name="purchasePrice"
            control={form.control}
            disabled={!isAdd}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl
                isRequired
                isInvalid={!!error}
                isReadOnly={!isAdd}
                isDisabled={!isAdd}
              >
                <FormControlLabel>
                  <FormControlLabelText>Harga Beli</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value.toString()}
                    autoComplete="off"
                    onChangeText={(text) => {
                      onChange(Number(text) || 0);
                      const currentUnitVariants =
                        form.getValues("unitVariants") || [];
                      currentUnitVariants.forEach((variant, i) => {
                        form.setValue(
                          `unitVariants.${i}.purchasePrice`,
                          Number(text) * variant.netto,
                        );
                      });
                    }}
                    onBlur={onBlur}
                    placeholder="Masukkan harga beli"
                    keyboardType="numeric"
                  />
                </Input>
                {!isAdd && (
                  <Text size="xs" className="text-gray-500 mt-1">
                    Harga Beli hanya bisa diubah melalui Pembelian Barang
                  </Text>
                )}
                {error && (
                  <FormControlError>
                    <FormControlErrorText className="text-red-500">
                      {error.message}
                    </FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />
          <Controller
            name="stock"
            control={form.control}
            disabled={!isAdd}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl
                isRequired={isAdd}
                isInvalid={!!error}
                isReadOnly={!isAdd}
                isDisabled={!isAdd}
              >
                <FormControlLabel>
                  <FormControlLabelText>
                    {isAdd ? "Stok Awal" : "Stok Terkini"}
                  </FormControlLabelText>
                </FormControlLabel>
                <Input isReadOnly={!isAdd} isDisabled={!isAdd}>
                  <InputField
                    value={value.toString()}
                    autoComplete="off"
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    onBlur={onBlur}
                    placeholder={isAdd ? "Masukkan stok awal" : ""}
                    keyboardType="numeric"
                    editable={isAdd}
                  />
                </Input>
                {!isAdd && (
                  <Text size="xs" className="text-gray-500 mt-1">
                    Stok hanya bisa diubah melalui Pembelian, Penjualan, Retur,
                    atau Stock Opname
                  </Text>
                )}
                {error && (
                  <FormControlError>
                    <FormControlErrorText className="text-red-500">
                      {error.message}
                    </FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Kategori</FormControlLabelText>
                </FormControlLabel>
                <HStack space="md">
                  <SelectModal
                    value={value}
                    placeholder="Pilih Kategori"
                    searchPlaceholder="Cari Kategori"
                    options={categories.map((cat) => ({
                      label: cat.name,
                      value: cat.id,
                    }))}
                    className="flex-1"
                    onChange={onChange}
                  />
                  <Pressable
                    className="size-10 rounded-full bg-primary-500 items-center justify-center"
                    onPress={() => {
                      setDataCategory(null);
                      setOpenCategory(true, (newCat) => {
                        form.setValue("categoryId", newCat.id);
                        refetchCategories();
                      });
                    }}
                  >
                    <Icon as={PlusIcon} color="white" />
                  </Pressable>
                </HStack>
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
            name="type"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>{`Jenis Produk `}</FormControlLabelText>
                </FormControlLabel>
                <SelectModal
                  value={value}
                  placeholder="Pilih Jenis Produk"
                  options={productTypeOptions}
                  className="w-full"
                  showSearch={false}
                  onChange={onChange}
                />
                {error && (
                  <FormControlError>
                    <FormControlErrorText className="text-red-500">
                      {error.message}
                    </FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />
          {selectedType === "MULTIUNIT" && (
            <>
              <Controller
                control={form.control}
                name="unit"
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FormControl
                    isRequired={selectedType === "MULTIUNIT"}
                    isInvalid={!!error}
                  >
                    <FormControlLabel>
                      <FormControlLabelText>Satuan</FormControlLabelText>
                    </FormControlLabel>
                    <SelectModal
                      value={value || ""}
                      placeholder="Pilih Satuan"
                      options={productUnitOptions}
                      className="w-full"
                      showSearch={false}
                      onChange={onChange}
                    />
                    {error && (
                      <FormControlError>
                        <FormControlErrorText>
                          {error.message}
                        </FormControlErrorText>
                      </FormControlError>
                    )}
                  </FormControl>
                )}
              />
              <VStack space="sm">
                <Text className="font-bold text-typography-700">
                  Varian Unit
                </Text>
                <VStack
                  space="md"
                  className="p-4 border border-primary-300 rounded-md bg-primary-200 shadow-lg"
                >
                  {unitVariantFields.map((field, index) => (
                    <Grid
                      key={field.id}
                      className="p-4 border border-primary-300 rounded-md gap-4"
                      _extra={{ className: "grid-cols-2" }}
                    >
                      <GridItem
                        _extra={{
                          className: "col-span-1",
                        }}
                      >
                        <Controller
                          name={`unitVariants.${index}.netto`}
                          control={form.control}
                          render={({
                            field: { onChange, onBlur, value },
                            fieldState: { error },
                          }) => (
                            <FormControl
                              isRequired
                              isInvalid={!!error}
                              isDisabled={!index}
                              className="w-full"
                            >
                              <FormControlLabel>
                                <FormControlLabelText>
                                  {`Netto${unit ? ` (${unit.toLowerCase()})` : ""}`}
                                </FormControlLabelText>
                              </FormControlLabel>
                              <Input>
                                <InputField
                                  value={nettoInput
                                    .find((f) => f.index === index)
                                    ?.netto.toString()}
                                  onChangeText={(text) => {
                                    if (/^\d*\.?\d*$/.test(text)) {
                                      setNettoInput(
                                        nettoInput.map((f) =>
                                          f.index === index
                                            ? { ...f, netto: text }
                                            : f,
                                        ),
                                      );
                                      onChange(Number(text) || 0);
                                      form.setValue(
                                        `unitVariants.${index}.purchasePrice`,
                                        Number(text) * purchasePrice,
                                      );
                                    }
                                  }}
                                  onBlur={() => {
                                    const numValue = parseFloat(
                                      nettoInput.find((f) => f.index === index)
                                        ?.netto || "0",
                                    );

                                    setNettoInput(
                                      nettoInput.map((f) =>
                                        f.index === index
                                          ? { ...f, netto: numValue.toString() }
                                          : f,
                                      ),
                                    );

                                    onChange(Number(numValue) || 0);
                                    form.setValue(
                                      `unitVariants.${index}.purchasePrice`,
                                      Number(numValue) * purchasePrice,
                                    );
                                    onBlur();
                                  }}
                                  placeholder="Masukkan netto"
                                  keyboardType="numbers-and-punctuation"
                                />
                              </Input>
                              {error && (
                                <FormControlError>
                                  <FormControlErrorText>
                                    {error.message}
                                  </FormControlErrorText>
                                </FormControlError>
                              )}
                            </FormControl>
                          )}
                        />
                      </GridItem>
                      <GridItem
                        _extra={{
                          className: "col-span-1",
                        }}
                      >
                        <Controller
                          name={`unitVariants.${index}.purchasePrice`}
                          control={form.control}
                          render={({ field: { onChange, onBlur, value } }) => (
                            <FormControl isDisabled className="w-full">
                              <FormControlLabel>
                                <FormControlLabelText>
                                  Harga Beli
                                </FormControlLabelText>
                              </FormControlLabel>
                              <Input>
                                <InputField
                                  value={value?.toString() || ""}
                                  onChangeText={(text) => {
                                    onChange(Number(text) || 0);
                                  }}
                                  onBlur={onBlur}
                                  placeholder="0"
                                  keyboardType="numeric"
                                />
                              </Input>
                            </FormControl>
                          )}
                        />
                      </GridItem>
                      <GridItem
                        _extra={{
                          className: "col-span-1",
                        }}
                      >
                        <Controller
                          name={`unitVariants.${index}.code`}
                          control={form.control}
                          render={({
                            field: { onChange, onBlur, value },
                            fieldState: { error },
                          }) => (
                            <FormControl
                              isRequired
                              isInvalid={!!error}
                              className="w-full"
                            >
                              <FormControlLabel>
                                <FormControlLabelText>
                                  Kode Varian
                                </FormControlLabelText>
                              </FormControlLabel>
                              <HStack space="md">
                                <Input className="flex-1">
                                  <InputField
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    placeholder="Contoh: V001"
                                  />
                                </Input>
                                <Pressable
                                  className={classNames(
                                    "size-10 rounded-md bg-white border border-primary-500 items-center justify-center",
                                    scanBarcodePosition ===
                                      `unitVariants.${index}.code` &&
                                      "bg-primary-500",
                                  )}
                                  onPress={() => {
                                    if (
                                      scanBarcodePosition ===
                                      `unitVariants.${index}.code`
                                    ) {
                                      setScanBarcodePosition(null);
                                    } else {
                                      setScanBarcodePosition(
                                        `unitVariants.${index}.code`,
                                      );
                                    }
                                  }}
                                >
                                  <Icon
                                    as={ScanBarcode}
                                    color={
                                      scanBarcodePosition ===
                                      `unitVariants.${index}.code`
                                        ? "#fff"
                                        : "#3d2117"
                                    }
                                  />
                                </Pressable>
                              </HStack>
                              {error && (
                                <FormControlError>
                                  <FormControlErrorText>
                                    {error.message}
                                  </FormControlErrorText>
                                </FormControlError>
                              )}
                            </FormControl>
                          )}
                        />
                      </GridItem>
                      <GridItem
                        _extra={{
                          className: "col-span-1",
                        }}
                      >
                        <Controller
                          name={`unitVariants.${index}.retailPrice`}
                          control={form.control}
                          render={({
                            field: { onChange, onBlur, value },
                            fieldState: { error },
                          }) => (
                            <FormControl
                              isRequired
                              isInvalid={!!error}
                              className="w-full"
                            >
                              <FormControlLabel>
                                <FormControlLabelText>
                                  Harga Retail
                                </FormControlLabelText>
                              </FormControlLabel>
                              <Input>
                                <InputField
                                  value={value?.toString() || ""}
                                  onChangeText={(text) => {
                                    onChange(Number(text) || 0);
                                  }}
                                  onBlur={onBlur}
                                  placeholder="0"
                                  keyboardType="numeric"
                                />
                              </Input>
                              {error && (
                                <FormControlError>
                                  <FormControlErrorText>
                                    {error.message}
                                  </FormControlErrorText>
                                </FormControlError>
                              )}
                            </FormControl>
                          )}
                        />
                      </GridItem>
                      {index > 0 && (
                        <GridItem
                          _extra={{
                            className: "col-span-2",
                          }}
                        >
                          <Button
                            size="xs"
                            action="negative"
                            onPress={() => unitVariantRemove(index)}
                          >
                            <SolarIconBold
                              name="TrashBin2"
                              color="#FDFBF9"
                              size={14}
                            />
                            <ButtonText className="text-white">
                              Hapus
                            </ButtonText>
                          </Button>
                        </GridItem>
                      )}
                    </Grid>
                  ))}
                  <Button
                    size="sm"
                    onPress={() => {
                      const newIndex = unitVariantFields.length;
                      unitVariantAppend({
                        code: "",
                        netto: 0,
                        purchasePrice: 0,
                        retailPrice: 0,
                      });
                      setNettoInput([
                        ...nettoInput,
                        { index: newIndex, netto: "0" },
                      ]);
                    }}
                    className="bg-brand-primary"
                  >
                    <ButtonText className="text-white">
                      + Tambah Varian Unit
                    </ButtonText>
                  </Button>
                </VStack>
              </VStack>
            </>
          )}

          {/* VARIANTS SECTION */}
          {selectedType === "VARIANTS" && (
            <VStack space="sm">
              <Text className="font-bold text-typography-700">
                Varian Produk
              </Text>
              <VStack
                space="md"
                className="p-4 border border-primary-300 rounded-md bg-primary-200 shadow-lg"
              >
                {variantFields.map((field, index) => (
                  <Grid
                    key={field.id}
                    _extra={{ className: "grid-cols-1" }}
                    className="gap-4 p-4 border border-primary-300 rounded-md"
                  >
                    <GridItem _extra={{ className: "col-span-1" }}>
                      <Controller
                        name={`variants.${index}.code`}
                        control={form.control}
                        render={({
                          field: { onChange, onBlur, value },
                          fieldState: { error },
                        }) => (
                          <FormControl
                            isRequired
                            isInvalid={!!error}
                            className="w-full"
                          >
                            <FormControlLabel>
                              <FormControlLabelText>
                                Kode Varian
                              </FormControlLabelText>
                            </FormControlLabel>
                            <HStack space="md">
                              <Input className="flex-1">
                                <InputField
                                  value={value}
                                  onChangeText={onChange}
                                  onBlur={onBlur}
                                  placeholder="Contoh: V001"
                                />
                              </Input>
                              <Pressable
                                className={classNames(
                                  "size-10 rounded-md bg-white border border-primary-500 items-center justify-center",
                                  scanBarcodePosition ===
                                    `variants.${index}.code` &&
                                    "bg-primary-500",
                                )}
                                onPress={() => {
                                  if (
                                    scanBarcodePosition ===
                                    `variants.${index}.code`
                                  ) {
                                    setScanBarcodePosition(null);
                                  } else {
                                    setScanBarcodePosition(
                                      `variants.${index}.code`,
                                    );
                                  }
                                }}
                              >
                                <Icon
                                  as={ScanBarcode}
                                  color={
                                    scanBarcodePosition ===
                                    `variants.${index}.code`
                                      ? "#fff"
                                      : "#3d2117"
                                  }
                                />
                              </Pressable>
                            </HStack>
                            {error && (
                              <FormControlError>
                                <FormControlErrorText>
                                  {error.message}
                                </FormControlErrorText>
                              </FormControlError>
                            )}
                          </FormControl>
                        )}
                      />
                    </GridItem>
                    {variantFields.length > 1 && (
                      <GridItem _extra={{ className: "col-span-1" }}>
                        <Button
                          size="xs"
                          action="negative"
                          className="w-full"
                          onPress={() => variantRemove(index)}
                        >
                          <SolarIconBold
                            name="TrashBin2"
                            color="#FDFBF9"
                            size={14}
                          />
                          <ButtonText className="text-white">Hapus</ButtonText>
                        </Button>
                      </GridItem>
                    )}
                  </Grid>
                ))}
                <Button
                  size="sm"
                  onPress={() => variantAppend({ code: "" })}
                  className="bg-brand-primary"
                >
                  <ButtonText className="text-white">
                    + Tambah Varian
                  </ButtonText>
                </Button>
              </VStack>
            </VStack>
          )}

          {/* RETAIL PRICE SECTION */}
          {selectedType !== "MULTIUNIT" && (
            <VStack space="sm">
              <Text className="font-bold text-typography-700">
                Harga Retail
              </Text>
              <VStack
                space="md"
                className="p-4 border border-primary-300 rounded-md bg-primary-200 shadow-lg"
              >
                {retailFields.map((field, index) => (
                  <Grid
                    key={field.id}
                    _extra={{ className: "grid-cols-2" }}
                    className="gap-4 p-4 border border-primary-300 rounded-md"
                  >
                    <GridItem _extra={{ className: "col-span-1" }}>
                      <Controller
                        name={`retailPrice.${index}.minimumPurchase`}
                        control={form.control}
                        render={({
                          field: { onChange, onBlur, value },
                          fieldState: { error },
                        }) => (
                          <FormControl
                            isRequired
                            isInvalid={!!error}
                            className="w-full"
                          >
                            <FormControlLabel>
                              <FormControlLabelText>
                                Minimal Pembelian
                              </FormControlLabelText>
                            </FormControlLabel>
                            <Input>
                              <InputField
                                value={value?.toString() || ""}
                                onChangeText={(text) =>
                                  onChange(Number(text) || 0)
                                }
                                onBlur={onBlur}
                                placeholder="1"
                                keyboardType="numeric"
                              />
                            </Input>
                            {error && (
                              <FormControlError>
                                <FormControlErrorText>
                                  {error.message}
                                </FormControlErrorText>
                              </FormControlError>
                            )}
                          </FormControl>
                        )}
                      />
                    </GridItem>
                    <GridItem _extra={{ className: "col-span-1" }}>
                      <Controller
                        name={`retailPrice.${index}.price`}
                        control={form.control}
                        render={({
                          field: { onChange, onBlur, value },
                          fieldState: { error },
                        }) => (
                          <FormControl
                            isRequired
                            isInvalid={!!error}
                            className="w-full"
                          >
                            <FormControlLabel>
                              <FormControlLabelText>Harga</FormControlLabelText>
                            </FormControlLabel>
                            <Input>
                              <InputField
                                value={value?.toString() || ""}
                                onChangeText={(text) => {
                                  onChange(Number(text) || 0);
                                }}
                                onBlur={onBlur}
                                placeholder="0"
                                keyboardType="numeric"
                              />
                            </Input>
                            {error && (
                              <FormControlError>
                                <FormControlErrorText>
                                  {error.message}
                                </FormControlErrorText>
                              </FormControlError>
                            )}
                          </FormControl>
                        )}
                      />
                    </GridItem>
                    {retailFields.length > 1 && (
                      <GridItem _extra={{ className: "col-span-2" }}>
                        <Button
                          size="xs"
                          action="negative"
                          className="w-full"
                          onPress={() => retailRemove(index)}
                        >
                          <SolarIconBold
                            name="TrashBin2"
                            color="#FDFBF9"
                            size={14}
                          />
                          <ButtonText className="text-white">Hapus</ButtonText>
                        </Button>
                      </GridItem>
                    )}
                  </Grid>
                ))}
                <Button
                  size="sm"
                  onPress={() => retailAppend({ minimumPurchase: 1, price: 0 })}
                  className="bg-brand-primary"
                >
                  <ButtonText className="text-white">
                    + Tambah Harga Retail
                  </ButtonText>
                </Button>
              </VStack>
            </VStack>
          )}

          {/* WHOLESALE PRICE SECTION */}
          <VStack space="sm">
            <Text className="font-bold text-typography-700">Harga Grosir</Text>
            <VStack
              space="md"
              className="p-4 border border-primary-300 rounded-md bg-primary-200 shadow-lg"
            >
              {wholesaleFields.length === 0 && (
                <Text className="text-typography-500 text-sm italic">
                  Belum ada harga grosir. Klik tombol di bawah untuk
                  menambahkan.
                </Text>
              )}
              {wholesaleFields.map((field, index) => (
                <Grid
                  key={field.id}
                  _extra={{ className: "grid-cols-2" }}
                  className="gap-4 p-4 border border-primary-300 rounded-md"
                >
                  <GridItem _extra={{ className: "col-span-1" }}>
                    <Controller
                      name={`wholesalePrice.${index}.minimumPurchase`}
                      control={form.control}
                      render={({
                        field: { onChange, onBlur, value },
                        fieldState: { error },
                      }) => (
                        <FormControl
                          isRequired
                          isInvalid={!!error}
                          className="w-full"
                        >
                          <FormControlLabel>
                            <FormControlLabelText>
                              Minimal Pembelian
                            </FormControlLabelText>
                          </FormControlLabel>
                          <Input>
                            <InputField
                              value={value?.toString() || ""}
                              onChangeText={(text) =>
                                onChange(Number(text) || 0)
                              }
                              onBlur={onBlur}
                              placeholder="10"
                              keyboardType="numeric"
                            />
                          </Input>
                          {error && (
                            <FormControlError>
                              <FormControlErrorText>
                                {error.message}
                              </FormControlErrorText>
                            </FormControlError>
                          )}
                        </FormControl>
                      )}
                    />
                  </GridItem>
                  <GridItem _extra={{ className: "col-span-1" }}>
                    <Controller
                      name={`wholesalePrice.${index}.price`}
                      control={form.control}
                      render={({
                        field: { onChange, onBlur, value },
                        fieldState: { error },
                      }) => (
                        <FormControl
                          isRequired
                          isInvalid={!!error}
                          className="w-full"
                        >
                          <FormControlLabel>
                            <FormControlLabelText>Harga</FormControlLabelText>
                          </FormControlLabel>
                          <Input>
                            <InputField
                              value={value?.toString() || ""}
                              onChangeText={(text) =>
                                onChange(Number(text) || 0)
                              }
                              onBlur={onBlur}
                              placeholder="0"
                              keyboardType="numeric"
                            />
                          </Input>
                          {error && (
                            <FormControlError>
                              <FormControlErrorText>
                                {error.message}
                              </FormControlErrorText>
                            </FormControlError>
                          )}
                        </FormControl>
                      )}
                    />
                  </GridItem>
                  <GridItem _extra={{ className: "col-span-2" }}>
                    <Button
                      size="xs"
                      action="negative"
                      onPress={() => wholesaleRemove(index)}
                    >
                      <SolarIconBold
                        name="TrashBin2"
                        color="#FDFBF9"
                        size={14}
                      />
                      <ButtonText className="text-white">Hapus</ButtonText>
                    </Button>
                  </GridItem>
                </Grid>
              ))}
              <Button
                size="sm"
                onPress={() =>
                  wholesaleAppend({ minimumPurchase: 1, price: 0 })
                }
                className="bg-brand-primary"
              >
                <ButtonText className="text-white">
                  + Tambah Harga Grosir
                </ButtonText>
              </Button>
            </VStack>
          </VStack>

          <Controller
            name="minimumStock"
            control={form.control}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Stok Minimum</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value.toString()}
                    autoComplete="off"
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    onBlur={onBlur}
                    placeholder="Masukkan stok minimum"
                    keyboardType="numeric"
                  />
                </Input>
                {error && (
                  <FormControlError>
                    <FormControlErrorText className="text-red-500">
                      {error.message}
                    </FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />
          <Controller
            control={form.control}
            name="brandId"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Brand</FormControlLabelText>
                </FormControlLabel>
                <HStack space="md">
                  <SelectModal
                    value={value}
                    placeholder="Pilih Brand"
                    searchPlaceholder="Cari Brand"
                    options={brands.map((brand) => ({
                      label: brand.name,
                      value: brand.id,
                    }))}
                    className="flex-1"
                    onChange={onChange}
                  />
                  <Pressable
                    className="size-10 rounded-full bg-primary-500 items-center justify-center"
                    onPress={() => {
                      setDataBrand(null);
                      setOpenBrand(true, (newBrand) => {
                        form.setValue("brandId", newBrand.id);
                        refetchBrands();
                      });
                    }}
                  >
                    <Icon as={PlusIcon} color="white" />
                  </Pressable>
                </HStack>
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
            name="discountId"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Diskon</FormControlLabelText>
                </FormControlLabel>
                <HStack space="md">
                  <SelectModal
                    value={value || ""}
                    placeholder="Pilih Diskon"
                    searchPlaceholder="Cari Diskon"
                    options={discounts.map((disc) => ({
                      label: disc.name,
                      value: disc.id,
                      actions: [
                        {
                          label: "Edit",
                          icon: "Pen",
                          onPress: () => {
                            setDataDiscount(disc);
                            setOpenDiscount(true, (newDisc) => {
                              form.setValue("discountId", newDisc.id);
                              refetchDiscounts();
                            });
                          },
                        },
                        {
                          label: "Delete",
                          icon: "TrashBin2",
                          onPress: () => handleDeletePress(disc),
                        },
                      ],
                    }))}
                    className="flex-1"
                    onChange={onChange}
                  />
                  <Pressable
                    className="size-10 rounded-full bg-primary-500 items-center justify-center"
                    onPress={() => {
                      setDataDiscount(null);
                      setOpenDiscount(true, (newDisc) => {
                        form.setValue("discountId", newDisc.id);
                        refetchDiscounts();
                      });
                    }}
                  >
                    <Icon as={PlusIcon} color="white" />
                  </Pressable>
                </HStack>
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error.message}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />
          <Controller
            name="description"
            control={form.control}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Keterangan</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value}
                    autoComplete="off"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Masukkan keterangan"
                  />
                </Input>
                {error && (
                  <FormControlError>
                    <FormControlErrorText className="text-red-500">
                      {error.message}
                    </FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />
        </VStack>
      </ScrollView>
      <HStack className="w-full p-4 border-t border-slate-200 justify-end gap-4">
        <Pressable
          className="w-full rounded-sm h-10 flex justify-center items-center bg-primary-500 border border-primary-500"
          disabled={isLoading}
          onPress={form.handleSubmit(onSubmit, (errors) => {
            console.error(
              "[PRODUCT_FORM] Validation Errors: ",
              JSON.stringify(errors, null, 2),
            );
          })}
        >
          {isLoading ? (
            <Spinner size="small" color="#FFFFFF" />
          ) : (
            <Text size="sm" className="text-typography-0 font-bold">
              SIMPAN
            </Text>
          )}
        </Pressable>
      </HStack>
      <BarcodeScanner
        onBarcodeScanned={(result) => {
          if (scanBarcodePosition === null) return;
          form.setValue(scanBarcodePosition as any, result.data);
        }}
      />
    </VStack>
  );
}
