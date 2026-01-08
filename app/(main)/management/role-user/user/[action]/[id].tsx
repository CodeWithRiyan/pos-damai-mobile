import UserDetail from "@/components/screens/user/detail";
import UserForm from "@/components/screens/user/form";
import { useLocalSearchParams } from "expo-router";

export default function UserActionId() {
  const { action } = useLocalSearchParams();

  const detail = action === "detail";

  if (detail) return <UserDetail />;

  return <UserForm />;
}
