import ActionDrawer from "@/components/action-drawer";
import {
  Button,
  ButtonText,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  HStack,
  Input,
  InputField,
  Switch,
  Text,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
import { getErrorMessage } from "@/lib/api/client";
import {
  Permission,
  useCreateRole,
  usePermissions,
  useRole,
  useRoles,
  useUpdateRole,
} from "@/lib/api/roles";
import { useActionDrawerStore } from "@/stores/action-drawer";
import { useEffect, useState } from "react";

export default function RoleForm() {
  const {
    showActionDrawer,
    dataId: roleId,
    setShowActionDrawer,
    setDataId,
  } = useActionDrawerStore();
  const isAdd = showActionDrawer === "ROLE-ADD";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const {
    data: role,
    isLoading: isLoadingRole,
    refetch: refetchRole,
  } = useRole(roleId || "");
  const { refetch: refetchRoles } = useRoles();
  const { data: permissions = [], isLoading: isLoadingPermissions } =
    usePermissions();
  const isLoading = isLoadingRole || isLoadingPermissions;

  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
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

  useEffect(() => {
    if (roleId && role) {
      setName(role.name || "");
      setDescription(role.description || "");
      setSelectedPermissions(role.permissions?.map((p) => p.id) || []);
    } else if (!roleId) {
      setName("");
      setDescription("");
      setSelectedPermissions([]);
    }
  }, [roleId, role]);

  const onRefetch = () => {
    refetchRoles();

    if (roleId) {
      refetchRole();
    }
  };

  const handleCancel = () => {
    if (roleId) {
      setShowActionDrawer("ROLE-DETAIL");
    } else {
      setShowActionDrawer(null);
      setDataId(null);
    }
  };

  const handleSubmit = async () => {
    const data = {
      name,
      description,
      level: 1,
      isSystem: false,
      permissionIds: selectedPermissions,
    };

    if (role && roleId) {
      updateMutation.mutate(
        { id: roleId, ...data },
        {
          onSuccess: () => {
            onRefetch();
            handleCancel();
          },
          onError: (error) => {
            showErrorToast(error);
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          onRefetch();
          handleCancel();
        },
        onError: (error) => {
          showErrorToast(error);
        },
      });
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const groupedPermissions = permissions.reduce(
    (acc: Record<string, Permission[]>, permission: Permission) => {
      const module = permission.module;
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    },
    {}
  );

  return (
    <ActionDrawer
      actionType={isAdd ? "ROLE-ADD" : "ROLE-EDIT"}
      header={isAdd ? "TAMBAH ROLE" : "EDIT ROLE"}
      onClose={handleCancel}
      footer={
        <HStack className="flex-1 p-4 border-t border-slate-200 justify-end gap-4">
          <Button
            action="primary"
            onPress={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-brand-primary flex-1"
          >
            <ButtonText className="text-white">
              {createMutation.isPending || updateMutation.isPending
                ? "MENYIMPAN..."
                : "SIMPAN"}
            </ButtonText>
          </Button>
        </HStack>
      }
    >
      <VStack space="lg" className="p-4">
        <FormControl isRequired>
          <FormControlLabel>
            <FormControlLabelText>Nama Role</FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField
              value={name}
              onChangeText={setName}
              placeholder="Masukkan nama role"
            />
          </Input>
        </FormControl>

        <FormControl>
          <FormControlLabel>
            <FormControlLabelText>Catatan</FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField
              value={description}
              onChangeText={setDescription}
              placeholder="Masukkan catatan"
            />
          </Input>
        </FormControl>

        <VStack space="md" className="mb-4">
          <Text className="font-medium">Izin Akses</Text>
          {isLoadingPermissions ? (
            <Text>Loading izin akses...</Text>
          ) : permissions.length === 0 ? (
            <Text size="sm" className="text-slate-400 italic">
              No permissions found.
            </Text>
          ) : (
            Object.entries(groupedPermissions).map(
              ([module, modulePermissions]) => (
                <VStack
                  key={module}
                  space="sm"
                  className="mb-2 border rounded-md p-4"
                >
                  <Text className="font-medium text-slate-500 uppercase text-sm">
                    {module}
                  </Text>
                  <VStack space="xs">
                    {modulePermissions.map((permission) => (
                      <HStack
                        key={permission.id}
                        className="items-center justify-between py-2"
                      >
                        <Text className="flex-1 text-sm">
                          {permission.description}
                        </Text>
                        <Switch
                          size="md"
                          value={selectedPermissions.includes(permission.id)}
                          onToggle={() => togglePermission(permission.id)}
                        />
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              )
            )
          )}
        </VStack>
      </VStack>
    </ActionDrawer>
  );
}
