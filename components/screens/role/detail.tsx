import { useActionDrawer } from "@/components/action-drawer";
import Header from "@/components/header";
import { Box, HStack, Text, VStack } from "@/components/ui";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import useBreakpoint from "@/hooks/use-breakpoint";
import { useDeleteEntity } from "@/hooks/use-delete-entity";
import { singleDeleteConfirm } from "@/lib/utils/delete-confirm";
import { useDeleteRole, useRole, useRoles } from "@/lib/api/roles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView } from "react-native";

export default function RoleDetail() {
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const roleId = id as string;

  const { sm } = useBreakpoint();

  const { refetch: refetchRoles } = useRoles();
  const { data: role, refetch: refetchRole } = useRole(roleId || "");
  const deleteMutation = useDeleteRole();

  const onRefetch = () => {
    refetchRoles();
    refetchRole();
  };

  const { triggerDelete } = useDeleteEntity({
    successMessage: "Role berhasil dihapus",
    deleteMutation,
    onSuccess: onRefetch,
  });

  const handleAction = () => {
    showActionDrawer({
      actions: [
        {
          label: "Edit",
          icon: "Pen",
          onPress: () => {
            router.navigate(
              `/(main)/management/role-user/role/edit/${role?.id}`,
            );
            hideActionDrawer();
          },
        },
        {
          label: "Hapus",
          icon: "TrashBin2",
          theme: "red",
          onPress: () => {
            triggerDelete(
              singleDeleteConfirm("role", role?.id || "", role?.name),
            );
            hideActionDrawer();
          },
        },
      ],
    });
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="DETAIL ROLE"
        action={
          <HStack space="sm">
            <Pressable className="p-6" onPress={handleAction}>
              <SolarIconBold
                name="MenuDots"
                size={20}
                color="#FDFBF9"
                style={{ transform: [{ rotate: "90deg" }] }}
              />
            </Pressable>
          </HStack>
        }
        isGoBack
      />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box
          className={`p-4 border-b border-background-300 flex-row flex-wrap ${
            sm ? "gap-y-4" : "gap-y-4"
          }`}
        >
          <VStack className={`${sm ? "w-1/2" : "w-full"}`}>
            <Text className="text-gray-500 font-bold">Nama Role</Text>
            <Text>{role?.name}</Text>
          </VStack>
          <VStack className={`${sm ? "w-1/2" : "w-full"}`}>
            <Text className="text-gray-500 font-bold">Deskripsi</Text>
            <Text>{role?.description || "-"}</Text>
          </VStack>
          <VStack className="w-full mt-2">
            <Text className="text-gray-500 font-bold">Izin Akses</Text>
            <Box
              className={`p-4 border border-background-300 rounded-md flex-row flex-wrap mt-2 ${
                sm ? "gap-x-4 gap-y-2" : "gap-y-2"
              }`}
            >
              {role?.permissions?.map((permission) => (
                <Text
                  key={permission.id}
                  className={`font-medium capitalize ${
                    sm ? "w-[48%]" : "w-full"
                  }`}
                >
                  {permission.name}
                </Text>
              ))}
            </Box>
          </VStack>
        </Box>
      </ScrollView>
    </VStack>
  );
}
