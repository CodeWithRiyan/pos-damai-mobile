import RoleDetail from "@/components/screens/role/detail";
import RoleForm from "@/components/screens/role/form";
import { useLocalSearchParams } from "expo-router";

export default function RoleActionId() {
  const { action } = useLocalSearchParams();

  const detail = action === "detail";

  if (detail) return <RoleDetail />;

  return <RoleForm />;
}
