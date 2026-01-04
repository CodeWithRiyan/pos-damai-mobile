import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import RoleDetail from "@/components/screens/role/detail";
import RoleForm from "@/components/screens/role/form";
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
import { Role, useDeleteRole, useRoles } from "@/lib/api/roles";
import { useActionDrawerStore } from "@/stores/action-drawer";
import React, { useState } from "react";
import { ScrollView } from "react-native";

export default function RoleList() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();

  const { setShowActionDrawer, setDataId } = useActionDrawerStore();
  const { data, isLoading, refetch } = useRoles();
  const [selectedRoles, setSelectedRoles] = useState<Role[] | null>(null);

  const roles = data || [];

  const deleteMutation = useDeleteRole();
  const toast = useToast();

  const handleRolePress = (role: Role) => {
    if (selectedRoles?.some((r) => r.id === role.id)) {
      setSelectedRoles(selectedRoles.filter((r) => r.id !== role.id));
      return;
    }
    if (!selectedRoles) {
      setSelectedRoles([role]);
      return;
    }

    setSelectedRoles([...selectedRoles, role]);
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

  const handleAddRole = () => {
    setSelectedRoles(null);
    setShowActionDrawer("ROLE-ADD");
  };

  const handleDeletePress = () => {
    const roleToDelete = selectedRoles?.[0] || null;

    showPopUpConfirm({
      title: "HAPUS KARYAWAN",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus role `}
          <Text className="font-bold text-slate-900">{roleToDelete?.name}</Text>
          {` ? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(roleToDelete),
      loading: deleteMutation.isPending,
    });
  };

  const confirmDelete = async (user: Role | null) => {
    if (!user) return;

    deleteMutation.mutate(user.id, {
      onSuccess: () => {
        setSelectedRoles(null);
        hidePopUpConfirm();
        refetch();

        toast.show({
          placement: "top",
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Role berhasil dihapus</ToastTitle>
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
        isGoBack
        action={
          <HStack space="sm" className="w-[72px]">
            {!!selectedRoles?.length ? (
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
              {roles.map((role) => (
                <Pressable
                  key={role.id}
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                    selectedRoles?.some((r) => r.id === role.id)
                      ? "bg-gray-100"
                      : ""
                  }`}
                  onPress={() => {
                    if (!!selectedRoles?.length) {
                      handleRolePress(role);
                    } else {
                      setShowActionDrawer("ROLE-DETAIL");
                      setDataId(role.id);
                      setSelectedRoles(null);
                    }
                  }}
                  onLongPress={() => handleRolePress(role)}
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
                  </HStack>
                </Pressable>
              ))}
              {roles?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">No roles found</Text>
                </Box>
              )}
            </VStack>
          </ScrollView>
          <HStack className="w-full p-4">
            <Button
              size="sm"
              className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
              onPress={handleAddRole}
            >
              <ButtonText className="text-white">TAMBAH ROLE</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
      <RoleForm />
      <RoleDetail />
    </Box>
  );
}
