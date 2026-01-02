import Header from "@/components/header";
import { RoleFormModal } from "@/components/role-form-modal";
import { Icon, ThreeDotsIcon } from "@/components/ui";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { getErrorMessage } from "@/lib/api/client";
import { Role, useDeleteRole, useRoles } from "@/lib/api/roles";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";

export default function RolesScreen() {
  const { data: roles, isLoading, refetch } = useRoles();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteMutation = useDeleteRole();
  const toast = useToast();

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

  const handleAddRole = () => {
    console.log("RolesScreen: handleAddRole called");
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    console.log("RolesScreen: handleEditRole called for role:", role.id);
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleDeletePress = (role: Role) => {
    setRoleToDelete(role);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;

    setIsDeleting(true);
    deleteMutation.mutate(roleToDelete.id, {
      onSuccess: () => {
        setIsDeleting(false);
        setRoleToDelete(null);
        refetch();
      },
      onError: (error) => {
        setIsDeleting(false);
        showErrorToast(error);
      },
    });
  };

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-white">
      <Header
        header="ROLE"
        action={<Icon as={ThreeDotsIcon} className="p-6" />}
        isGoBack
      />
      <Box className="flex-1 bg-white p-4">
        <RoleFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          role={selectedRole}
          onSuccess={refetch}
        />
        <VStack space="lg">
          <HStack className="justify-between items-center">
            <Heading size="xl">Roles</Heading>
            <Button
              size="sm"
              className="rounded-full bg-brand-primary active:bg-brand-primary/90"
              onPress={handleAddRole}
            >
              <IconSymbol name="plus" size={16} color="#fff" />
              <ButtonText className="text-white">Add Role</ButtonText>
            </Button>
          </HStack>

          <ScrollView className="mt-4">
            <VStack space="md">
              {(Array.isArray(roles) ? roles : []).map((role) => (
                <Box
                  key={role.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <HStack className="justify-between items-center">
                    <VStack className="flex-1">
                      <Heading size="sm">{role.name}</Heading>
                      {role.description && (
                        <Text size="xs" className="text-slate-400 mt-0.5">
                          {role.description}
                        </Text>
                      )}
                      <Text size="xs" className="text-slate-500 mt-1">
                        {role.permissions?.length || 0} permissions assigned •
                        Level {role.level}
                      </Text>
                    </VStack>
                    <HStack space="sm">
                      <Button
                        variant="outline"
                        size="xs"
                        className="rounded-full w-8 h-8 p-0"
                        onPress={() => handleEditRole(role)}
                      >
                        <IconSymbol name="pencil" size={14} color="#64748b" />
                      </Button>
                      <Button
                        variant="outline"
                        action="negative"
                        size="xs"
                        className="rounded-full w-8 h-8 p-0"
                        onPress={() => handleDeletePress(role)}
                      >
                        <IconSymbol name="trash" size={14} color="#ef4444" />
                      </Button>
                    </HStack>
                  </HStack>
                </Box>
              ))}
              {roles?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">No roles found</Text>
                </Box>
              )}
            </VStack>
          </ScrollView>
        </VStack>

        {/* Delete Confirmation Modal */}
        {roleToDelete && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 2000,
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <Box className="bg-white rounded-2xl p-6 w-full max-w-[400px] shadow-2xl">
              <VStack space="lg">
                <VStack space="xs">
                  <Heading size="md">Hapus Role</Heading>
                  <Text size="sm" className="text-slate-500">
                    Apakah Anda yakin ingin menghapus role{" "}
                    <Text className="font-bold text-slate-900">
                      &quot;{roleToDelete.name}&quot;
                    </Text>
                    ? Tindakan ini tidak dapat dibatalkan.
                  </Text>
                </VStack>

                <HStack space="md" className="justify-end">
                  <Button
                    variant="outline"
                    action="secondary"
                    onPress={() => setRoleToDelete(null)}
                    disabled={isDeleting}
                  >
                    <ButtonText>Batal</ButtonText>
                  </Button>
                  <Button
                    action="negative"
                    onPress={confirmDelete}
                    disabled={isDeleting}
                    className="bg-red-500"
                  >
                    <ButtonText className="text-white">
                      {isDeleting ? "Menghapus..." : "Hapus"}
                    </ButtonText>
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </View>
        )}
      </Box>
    </Box>
  );
}
