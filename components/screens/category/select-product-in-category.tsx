import { useCategory } from '@/lib/api/categories';
import { useLocalSearchParams, useRouter } from "expo-router";
import { Product } from "../product";
import SelectingProductList from "../product/selecting-product";

export default function SelectProductInCategory() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const categoryId = id as string;
  const { data } = useCategory(categoryId);

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
