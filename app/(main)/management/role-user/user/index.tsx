import Header from "@/components/header";
import UserDetail from "@/components/screens/user/detail";
import UserForm from "@/components/screens/user/form";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { getErrorMessage } from "@/lib/api/client";
import { useDeleteUser, User, useUsers } from "@/lib/api/users";
import { useActionDrawerStore } from "@/stores/action-drawer";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";

export default function UsersScreen() {
  const { setShowActionDrawer, setDataId } = useActionDrawerStore();
  const router = useRouter();
  const { data: users, isLoading, refetch } = useUsers();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[] | null>(null);

  const deleteMutation = useDeleteUser();
  const toast = useToast();

  const handleRolePress = (role: User) => {
    if (selectedUsers?.some((r) => r.id === role.id)) {
      setSelectedUsers(selectedUsers.filter((r) => r.id !== role.id));
      return;
    }
    if (!selectedUsers) {
      setSelectedUsers([role]);
      return;
    }

    setSelectedUsers([...selectedUsers, role]);
  };

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
    setSelectedUsers(null);
    setSelectedUsers(null);
    setShowActionDrawer("USER-ADD");
  };

  const handleDeletePress = () => {
    setUserToDelete(selectedUsers?.[0] || null);
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
        header="KARYAWAN"
        isGoBack
        action={
          <HStack space="sm" className="w-[72px]">
            {!!selectedUsers?.length ? (
              <Pressable className="p-6" onPress={() => handleDeletePress()}>
                <SolarIconBold name="TrashBin2" size={20} color="#FDFBF9" />
              </Pressable>
            ) : (
              <Pressable className="p-6" onPress={() => {}}>
                <SolarIconBold
                  name="MenuDots"
                  size={20}
                  color="#FDFBF9"
                  style={{ transform: [{ rotate: "90deg" }] }}
                />
              </Pressable>
            )}
          </HStack>
        }
      />
      <Box className="flex-1 bg-white">
        <VStack space="lg" className="flex-1">
          <ScrollView className="flex-1">
            <VStack>
              {users?.map((user) => (
                <Pressable
                  key={user.id}
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                    selectedUsers?.some((r) => r.id === user.id)
                      ? "bg-gray-100"
                      : ""
                  }`}
                  onPress={() => {
                    if (!!selectedUsers?.length) {
                      handleRolePress(user);
                    } else {
                      setShowActionDrawer("USER-DETAIL");
                      setDataId(user.id);
                      setSelectedUsers(null);
                    }
                  }}
                  onLongPress={() => handleRolePress(user)}
                >
                  <HStack className="justify-between items-center">
                    <HStack space="md" className="items-center">
                      <Box className="w-10 h-10 rounded-md bg-brand-secondary/20 items-center justify-center">
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
                          {user.roles?.[0]?.role?.name || "No role"}
                        </Text>
                      </VStack>
                    </HStack>
                  </HStack>
                </Pressable>
              ))}
              {users?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">No users found</Text>
                </Box>
              )}
            </VStack>
          </ScrollView>
          <HStack className="w-full p-4">
            <Button
              size="sm"
              className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
              onPress={handleAddUser}
            >
              <ButtonText className="text-white">TAMBAH KARYAWAN</ButtonText>
            </Button>
          </HStack>
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
      <UserForm />
      <UserDetail />
    </Box>
  );
}
