import Header from "@/components/header";
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
import { UserFormModal } from "@/components/user-form-modal";
import { getErrorMessage } from "@/lib/api/client";
import { useDeleteUser, User, useUsers } from "@/lib/api/users";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";

export default function UsersScreen() {
  const { data: users, isLoading, refetch } = useUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteMutation = useDeleteUser();
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

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeletePress = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    deleteMutation.mutate(userToDelete.id, {
      onSuccess: () => {
        setIsDeleting(false);
        setUserToDelete(null);
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
        header="USER"
        action={<Icon as={ThreeDotsIcon} className="p-6" />}
      />
      <Box className="flex-1 bg-white p-4">
        <UserFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={selectedUser}
          onSuccess={refetch}
        />
        <VStack space="lg">
          <HStack className="justify-between items-center">
            <Heading size="xl">Users</Heading>
            <Button
              size="sm"
              className="rounded-full bg-brand-primary active:bg-brand-primary/90"
              onPress={handleAddUser}
            >
              <IconSymbol name="plus" size={16} color="#fff" />
              <ButtonText className="text-white">Add User</ButtonText>
            </Button>
          </HStack>

          <ScrollView className="mt-4">
            <VStack space="md">
              {users?.map((user) => (
                <Box
                  key={user.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <HStack className="justify-between items-center">
                    <HStack space="md" className="items-center">
                      <Box className="w-10 h-10 rounded-full bg-brand-secondary/20 items-center justify-center">
                        <Text className="text-brand-primary font-bold">
                          {(user.firstName || user.username)
                            .substring(0, 1)
                            .toUpperCase()}
                        </Text>
                      </Box>
                      <VStack>
                        <Heading size="sm">
                          {user.firstName || user.username}
                        </Heading>
                        <Text size="xs" className="text-slate-500">
                          {user.email || "No email"}
                        </Text>
                      </VStack>
                    </HStack>
                    <HStack space="sm">
                      <Button
                        variant="outline"
                        size="xs"
                        className="rounded-full w-8 h-8 p-0"
                        onPress={() => handleEditUser(user)}
                      >
                        <IconSymbol name="pencil" size={14} color="#64748b" />
                      </Button>
                      <Button
                        variant="outline"
                        action="negative"
                        size="xs"
                        className="rounded-full w-8 h-8 p-0"
                        onPress={() => handleDeletePress(user)}
                      >
                        <IconSymbol name="trash" size={14} color="#ef4444" />
                      </Button>
                    </HStack>
                  </HStack>
                </Box>
              ))}
              {users?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">No users found</Text>
                </Box>
              )}
            </VStack>
          </ScrollView>
        </VStack>

        {/* Delete Confirmation Modal */}
        {userToDelete && (
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
                  <Heading size="md">Hapus User</Heading>
                  <Text size="sm" className="text-slate-500">
                    Apakah Anda yakin ingin menghapus user{" "}
                    <Text className="font-bold text-slate-900">
                      &quot;{userToDelete.username}&quot;
                    </Text>
                    ? Tindakan ini tidak dapat dibatalkan.
                  </Text>
                </VStack>

                <HStack space="md" className="justify-end">
                  <Button
                    variant="outline"
                    action="secondary"
                    onPress={() => setUserToDelete(null)}
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
