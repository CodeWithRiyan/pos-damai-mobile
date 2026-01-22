import Header from "@/components/header";
import {
  Button,
  ButtonText,
  ChevronDownIcon,
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
  Switch,
  Text,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { useBrands } from "@/lib/api/brands";
import { useCategories } from "@/lib/api/categories";
import { getErrorMessage } from "@/lib/api/client";
import { useDiscounts } from "@/lib/api/discounts";
import {
  CreateProductDTO,
  UpdateProductDTO,
  useCreateProduct,
  useProduct,
  useProducts,
  useUpdateProduct,
} from "@/lib/api/products";
import { useBrandStore } from "@/stores/brand";
import { useCategoryStore } from "@/stores/category";
import { useDiscountStore } from "@/stores/discount";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PlusIcon } from "lucide-react-native";
import { useEffect } from "react";
import {
  Controller,
  SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";

export default function ProductForm() {
  const { setOpen: setOpenCategory, setData: setDataCategory } =
    useCategoryStore();
  const { setOpen: setOpenBrand, setData: setDataBrand } = useBrandStore();
  const { setOpen: setOpenDiscount, setData: setDataDiscount } =
    useDiscountStore();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isAdd = !id;
  const productId = id as string;

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
      variants: z
        .array(
          z.object({
            name: z.string().min(1, "Nama wajib diisi."),
            code: z.string().min(1, "Kode wajib diisi."),
          }),
        )
        .nullable(),
      retailPrice: z
        .array(
          z.object({
            minimumPurchase: z.number().min(1, "Minimum purchase wajib diisi."),
            price: z.number().min(1, "Harga wajib diisi."),
          }),
        )
        .min(1, "Harga Retail wajib diisi."),
      wholesalePrice: z.array(
        z.object({
          minimumPurchase: z.number().min(1, "Minimum purchase wajib diisi."),
          price: z.number().min(1, "Harga wajib diisi."),
        }),
      ),
      discountId: z.string().optional().nullable(),
      isActive: z.boolean(),
      description: z.string(),
    })
    .superRefine((data, ctx) => {
      data.retailPrice.map((dataRetail) => {
        if (dataRetail.price < data.purchasePrice) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Harga Retail tidak boleh kurang dari harga beli",
            path: [`retailPrice.${data.retailPrice.indexOf(dataRetail)}.price`],
          });
        }
      });
      data.wholesalePrice.map((dataWholesale) => {
        if (dataWholesale.price < data.purchasePrice) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Harga Grosir tidak boleh kurang dari harga beli",
            path: [
              `wholesalePrice.${data.wholesalePrice.indexOf(dataWholesale)}.price`,
            ],
          });
        }
      });
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

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialValues,
  });

  const purchasePrice = form.watch("purchasePrice");

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
        variants: product.variants,
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

  const onSubmit: SubmitHandler<ProductFormValues> = (
    data: ProductFormValues,
  ) => {
    const prices = [
      ...data.retailPrice.map((p) => ({
        ...p,
        type: "RETAIL" as const,
        label: "Retail",
      })),
      ...data.wholesalePrice.map((p) => ({
        ...p,
        type: "WHOLESALE" as const,
        label: "Grosir",
      })),
    ];

    if (productId && product) {
      const updateData: UpdateProductDTO = {
        ...data,
        type: data.type as any,
        id: product.id,
        prices,
        variants: data.variants || [],
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
        variants: data.variants || [],
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
      <Header header={isAdd ? "TAMBAH PRODUK" : "EDIT PRODUK"} isGoBack />

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
                <Input>
                  <InputField
                    value={value}
                    autoComplete="name"
                    placeholder="Masukkan Kode"
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
            name="isActive"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl
                isInvalid={!!error}
                className="flex-row gap-4 items-center border border-background-300 px-4 rounded-md flex-1"
              >
                <FormControlLabel className="mb-0 flex-1">
                  <FormControlLabelText>
                    Tampilkan di transaksi
                  </FormControlLabelText>
                </FormControlLabel>
                <Switch
                  size="md"
                  value={value}
                  onChange={onChange}
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
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Harga Beli</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value.toString()}
                    autoComplete="off"
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    onBlur={onBlur}
                    placeholder="Masukkan harga beli"
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
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Kategori</FormControlLabelText>
                </FormControlLabel>
                <HStack space="md">
                  <Select
                    onValueChange={onChange}
                    onBlur={onBlur}
                    className="flex-1"
                  >
                    <SelectTrigger>
                      <SelectInput
                        value={categories.find((cat) => cat.id === value)?.name}
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
                            key={cat.id}
                            label={cat.name}
                            value={cat.id}
                            textStyle={{ className: "capitalize flex-1" }}
                            className="px-4 py-4"
                          />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
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
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Jenis Produk</FormControlLabelText>
                </FormControlLabel>
                <Select onValueChange={onChange} onBlur={onBlur}>
                  <SelectTrigger>
                    <SelectInput
                      value={
                        productTypeOptions.find((type) => type.value === value)
                          ?.label
                      }
                      placeholder="Pilih Jenis Produk"
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
                      {productTypeOptions.map((type) => (
                        <SelectItem
                          key={type.value}
                          label={type.label}
                          value={type.value}
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
          {selectedType === "MULTIUNIT" && (
            <Controller
              control={form.control}
              name="unit"
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <FormControl
                  isRequired={selectedType === "MULTIUNIT"}
                  isInvalid={!!error}
                >
                  <FormControlLabel>
                    <FormControlLabelText>Satuan</FormControlLabelText>
                  </FormControlLabel>
                  <Select onValueChange={onChange} onBlur={onBlur}>
                    <SelectTrigger>
                      <SelectInput
                        value={
                          productUnitOptions.find(
                            (unit) => unit.value === value,
                          )?.label
                        }
                        placeholder="Pilih Satuan"
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
                        {productUnitOptions.map((unit) => (
                          <SelectItem
                            key={unit.value}
                            label={unit.label}
                            value={unit.value}
                            textStyle={{ className: "capitalize flex-1" }}
                            className="px-4 py-4"
                          />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
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
                  <HStack
                    key={field.id}
                    space="md"
                    className="p-4 border border-primary-300 rounded-md"
                  >
                    <Controller
                      name={`variants.${index}.name`}
                      control={form.control}
                      render={({
                        field: { onChange, onBlur, value },
                        fieldState: { error },
                      }) => (
                        <FormControl
                          isRequired
                          isInvalid={!!error}
                          className="flex-1"
                        >
                          <FormControlLabel>
                            <FormControlLabelText>
                              Nama Varian
                            </FormControlLabelText>
                          </FormControlLabel>
                          <Input>
                            <InputField
                              value={value}
                              onChangeText={onChange}
                              onBlur={onBlur}
                              placeholder="Contoh: Merah, Biru"
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
                          className="flex-1"
                        >
                          <FormControlLabel>
                            <FormControlLabelText>
                              Kode Varian
                            </FormControlLabelText>
                          </FormControlLabel>
                          <Input>
                            <InputField
                              value={value}
                              onChangeText={onChange}
                              onBlur={onBlur}
                              placeholder="Contoh: V001"
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
                    {variantFields.length > 1 && (
                      <Button
                        size="xs"
                        action="negative"
                        onPress={() => variantRemove(index)}
                      >
                        <SolarIconBold
                          name="TrashBin2"
                          color="#FDFBF9"
                          size={14}
                        />
                      </Button>
                    )}
                  </HStack>
                ))}
                <Button
                  size="sm"
                  onPress={() => variantAppend({ name: "", code: "" })}
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
          <VStack space="sm">
            <Text className="font-bold text-typography-700">Harga Retail</Text>
            <VStack
              space="md"
              className="p-4 border border-primary-300 rounded-md bg-primary-200 shadow-lg"
            >
              {retailFields.map((field, index) => (
                <HStack
                  key={field.id}
                  space="md"
                  className="p-4 border border-primary-300 rounded-md"
                >
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
                        className="flex-1"
                      >
                        <FormControlLabel>
                          <FormControlLabelText>
                            Minimal Pembelian
                          </FormControlLabelText>
                        </FormControlLabel>
                        <Input>
                          <InputField
                            value={value?.toString() || ""}
                            onChangeText={(text) => onChange(Number(text) || 0)}
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
                        className="flex-1"
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
                  {retailFields.length > 1 && (
                    <Button
                      size="xs"
                      action="negative"
                      onPress={() => retailRemove(index)}
                    >
                      <SolarIconBold
                        name="TrashBin2"
                        color="#FDFBF9"
                        size={14}
                      />
                    </Button>
                  )}
                </HStack>
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
                <HStack
                  key={field.id}
                  space="md"
                  className="p-4 border border-primary-300 rounded-md"
                >
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
                        className="flex-1"
                      >
                        <FormControlLabel>
                          <FormControlLabelText>
                            Minimal Pembelian
                          </FormControlLabelText>
                        </FormControlLabel>
                        <Input>
                          <InputField
                            value={value?.toString() || ""}
                            onChangeText={(text) => onChange(Number(text) || 0)}
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
                        className="flex-1"
                      >
                        <FormControlLabel>
                          <FormControlLabelText>Harga</FormControlLabelText>
                        </FormControlLabel>
                        <Input>
                          <InputField
                            value={value?.toString() || ""}
                            onChangeText={(text) => onChange(Number(text) || 0)}
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
                  <Button
                    size="xs"
                    action="negative"
                    onPress={() => wholesaleRemove(index)}
                  >
                    <SolarIconBold name="TrashBin2" color="#FDFBF9" size={14} />
                  </Button>
                </HStack>
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
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Brand</FormControlLabelText>
                </FormControlLabel>
                <HStack space="md">
                  <Select
                    onValueChange={onChange}
                    onBlur={onBlur}
                    className="flex-1"
                  >
                    <SelectTrigger>
                      <SelectInput
                        value={brands.find((brand) => brand.id === value)?.name}
                        placeholder="Pilih Brand"
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
                        {brands.map((brand) => (
                          <SelectItem
                            key={brand.id}
                            label={brand.name}
                            value={brand.id}
                            textStyle={{ className: "capitalize flex-1" }}
                            className="px-4 py-4"
                          />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
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
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Diskon</FormControlLabelText>
                </FormControlLabel>
                <HStack space="md">
                  <Select
                    onValueChange={onChange}
                    onBlur={onBlur}
                    className="flex-1"
                  >
                    <SelectTrigger>
                      <SelectInput
                        value={
                          (discounts || []).find((disc) => disc.id === value)
                            ?.name
                        }
                        placeholder="Pilih Diskon"
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
                        {(discounts || []).map((disc) => (
                          <SelectItem
                            key={disc.id}
                            label={disc.name}
                            value={disc.id}
                            textStyle={{ className: "capitalize flex-1" }}
                            className="px-4 py-4"
                          />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
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
          className="w-full rounded-sm h-9 flex justify-center items-center bg-primary-500 border border-primary-500"
          disabled={isLoading}
          onPress={form.handleSubmit(onSubmit)}
        >
          <Text size="sm" className="text-typography-0 font-bold">
            {isLoading ? "MENYIMPAN..." : "SIMPAN"}
          </Text>
        </Pressable>
      </HStack>
    </VStack>
  );
}
