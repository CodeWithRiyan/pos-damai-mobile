import ActionDrawer from "@/components/action-drawer";
import {
  Button,
  ButtonText,
  ChevronDownIcon,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  HStack,
  Input,
  InputField,
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
  Switch,
  Toast,
  ToastTitle,
  useToast,
  VStack
} from "@/components/ui";
import { getErrorMessage } from "@/lib/api/client";
import { useRoles } from "@/lib/api/roles";
import { useCreateUser, useUpdateUser, useUser } from "@/lib/api/users";
import { useActionDrawerStore } from "@/stores/action-drawer";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

export default function UserForm() {
  const { showActionDrawer, dataId: userId, setShowActionDrawer } = useActionDrawerStore ();
  const router = useRouter();
  const isAdd = showActionDrawer === "USER-ADD";
  const isEdit = showActionDrawer === "USER-EDIT";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: user, isLoading: isLoadingUser, refetch } = useUser(userId || "");
  const { data: roles = [], isLoading: isLoadingRoles } = useRoles();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
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
    if (userId && user) {
      setUsername(user.username);
      setEmail(user.email || "");
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
      setRoleId(user.roles?.[0]?.roleId || "");
      setIsActive(user.isActive);
      setPassword("");
    } else {
      setUsername("");
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setRoleId("");
      setIsActive(true);
    }
  }, [user, userId]);

  const handleCancel = () => {
    setShowActionDrawer(null);
  };

  const handleSubmit = async () => {
    const data: any = {
      username,
      email,
      firstName,
      lastName,
      phone,
      roleId,
    };

    if (user) {
      data.id = user.id;
      data.isActive = isActive;
      updateMutation.mutate(data, {
        onSuccess: () => {
          refetch();
          handleCancel();
        },
        onError: (error) => {
          showErrorToast(error);
        },
      });
    } else {
      data.password = password;
      createMutation.mutate(data, {
        onSuccess: () => {
          refetch();
          handleCancel();
        },
        onError: (error) => {
          showErrorToast(error);
        },
      });
    }
  };

  return (
    <ActionDrawer
      actionType={isAdd ? "USER-ADD" : "USER-EDIT"}
      header={isAdd ? "TAMBAH KARYAWAN" : "EDIT KARYAWAN"}
      footer={
        <HStack className="flex-1 p-4 border-t border-slate-200 justify-end gap-4">
          <Button
            variant="outline"
            action="secondary"
            onPress={handleCancel}
            className="mr-3"
          >
            <ButtonText>BATAL</ButtonText>
          </Button>
          <Button
            action="primary"
            onPress={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-brand-primary"
          >
            <ButtonText className="text-white">
              {createMutation.isPending || updateMutation.isPending
                ? "MENYIMPAN..."
                : user
                ? "EDIT KARYAWAN"
                : "TAMBAH KARYAWAN"}
            </ButtonText>
          </Button>
        </HStack>
      }
    >
      <VStack space="lg" className="p-4">
        <FormControl isRequired>
          <FormControlLabel>
            <FormControlLabelText>Username</FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField
              value={username}
              autoComplete="off"
              onChangeText={setUsername}
              placeholder="Masukkan username"
            />
          </Input>
        </FormControl>

        <FormControl isRequired>
          <FormControlLabel>
            <FormControlLabelText>Email</FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField
              value={email}
              autoComplete="off"
              onChangeText={setEmail}
              placeholder="Masukkan email"
            />
          </Input>
        </FormControl>

        {!user && (
          <FormControl isRequired>
            <FormControlLabel>
              <FormControlLabelText>Password</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                value={password}
                autoComplete="new-password"
                onChangeText={setPassword}
                placeholder="Masukkan password"
                type="password"
              />
            </Input>
          </FormControl>
        )}

        <FormControl isRequired>
          <FormControlLabel>
            <FormControlLabelText>Nama Depan</FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Masukkan nama depan"
            />
          </Input>
        </FormControl>

        <FormControl isRequired>
          <FormControlLabel>
            <FormControlLabelText>Nama Belakang</FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField
              value={lastName}
              onChangeText={setLastName}
              placeholder="Masukkan nama belakang"
            />
          </Input>
        </FormControl>

        <FormControl isRequired>
          <FormControlLabel>
            <FormControlLabelText>No Handphone</FormControlLabelText>
          </FormControlLabel>
          <Input>
            <InputField
              value={phone}
              onChangeText={setPhone}
              placeholder="Masukkan no handphone"
            />
          </Input>
        </FormControl>

        <FormControl isRequired isInvalid>
          <FormControlLabel>
            <FormControlLabelText>Role</FormControlLabelText>
          </FormControlLabel>
          <Select>
            <SelectTrigger>
              <SelectInput placeholder="Pilih Role" className="flex-1" />
              <SelectIcon className="mr-3" as={ChevronDownIcon} />
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                <SelectDragIndicatorWrapper>
                  <SelectDragIndicator />
                </SelectDragIndicatorWrapper>
                {roles.map((role) => (
                  <SelectItem key={role.id} label={role.name} value={role.id} />
                ))}
              </SelectContent>
            </SelectPortal>
          </Select>
        </FormControl>

        {user && (
          <FormControl
            isInvalid
            className="flex-row gap-4 items-center border border-background-300 p-4 rounded-md flex-1"
          >
            <FormControlLabel className="mb-0 flex-1">
              <FormControlLabelText>Akun Aktif</FormControlLabelText>
            </FormControlLabel>
            <Switch
              size="md"
              value={isActive}
              onToggle={() => setIsActive(!isActive)}
              className="border-none"
            />
          </FormControl>
        )}
      </VStack>
    </ActionDrawer>
  );
}
