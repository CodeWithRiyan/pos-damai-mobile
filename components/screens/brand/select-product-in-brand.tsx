import { useBrand } from '@/lib/api/brands';
import { useLocalSearchParams, useRouter } from "expo-router";
import { Product } from "../product";
import SelectingProductList from "../product/selecting-product";

export default function SelectProductInBrand() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const brandId = id as string;
  const { data } = useBrand(brandId);

  console.log("brand: ", id, data);

  const handleSubmit = (value: Product[]) => {
    console.log("selected products: ", value);
    router.back(); // back to detail after submit success
  };

  return (
    <SelectingProductList
      header="TAMBAH PRODUK"
      selectedItems={[]} // initial selected items
      onSubmit={handleSubmit}
    />
  );
}
