import Header from "@/components/header";
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
  VStack,
} from "@/components/ui";
import { getErrorMessage } from "@/lib/api/client";
import { useRoles } from "@/lib/api/roles";
import {
  CreateUserDTO,
  UpdateUserDTO,
  useCreateUser,
  useUpdateUser,
  useUser,
  useUsers,
} from "@/lib/api/users";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";

export default function UserForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isAdd = !id;
  const userId = id as string;

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { refetch: refetchUsers } = useUsers();
  const { data: user, refetch: refetchUser } = useUser(userId || "");
  const { data: roles = [] } = useRoles();
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

  const onRefetch = () => {
    refetchUsers();

    if (userId) {
      refetchUser();
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSubmit = async () => {
    const data: CreateUserDTO = {
      username,
      email,
      firstName,
      lastName,
      phone,
      roleId,
    };

    if (userId && user) {
      const updateData: UpdateUserDTO = {
        ...data,
        id: user.id,
        isActive,
      };

      updateMutation.mutate(updateData, {
        onSuccess: () => {
          onRefetch();
          handleCancel();

          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Karyawan berhasil diubah</ToastTitle>
              </Toast>
            ),
          });
        },
        onError: (error) => {
          showErrorToast(error);
        },
      });
    } else {
      const createData: CreateUserDTO = {
        ...data,
        password,
      };

      createMutation.mutate(createData, {
        onSuccess: () => {
          onRefetch();
          handleCancel();

          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Karyawan berhasil diubah</ToastTitle>
              </Toast>
            ),
          });
        },
        onError: (error) => {
          showErrorToast(error);
        },
      });
    }
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header header={isAdd ? "TAMBAH KARYAWAN" : "EDIT KARYAWAN"} isGoBack />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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

          <FormControl>
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

          <FormControl>
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
            <Select onValueChange={setRoleId}>
              <SelectTrigger>
                <SelectInput
                  placeholder="Pilih Role"
                  className="flex-1 capitalize"
                />
                <SelectIcon className="mr-3" as={ChevronDownIcon} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent className="px-0">
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {roles.map((role) => (
                    <SelectItem
                      key={role.id}
                      label={role.name}
                      value={role.id}
                      textStyle={{ className: "capitalize flex-1" }}
                      className="px-4 py-4"
                    />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </FormControl>

          {user && (
            <FormControl
              isInvalid
              className="flex-row gap-4 items-center border border-background-300 px-4 rounded-md flex-1"
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
      </ScrollView>
      <HStack className="w-full p-4 border-t border-slate-200 justify-end gap-4">
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
    </VStack>
  );
}
