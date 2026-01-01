import { getErrorMessage } from '@/lib/api/client';
import { Permission, Role, useCreateRole, usePermissions, useUpdateRole } from '@/lib/api/roles';
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Box } from './ui/box';
import { Button, ButtonText } from './ui/button';
import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from './ui/checkbox';
import { FormControl, FormControlLabel, FormControlLabelText } from './ui/form-control';
import { Heading } from './ui/heading';
import { HStack } from './ui/hstack';
import { CheckIcon, CloseIcon, Icon } from './ui/icon';
import { Input, InputField } from './ui/input';
import { Text } from './ui/text';
import { Toast, ToastTitle, useToast } from './ui/toast';
import { VStack } from './ui/vstack';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null;
  onSuccess: () => void;
}

export function RoleFormModal({ isOpen, onClose, role, onSuccess }: RoleFormModalProps) {
  console.log('RoleFormModal: rendering with isOpen =', isOpen);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: permissions = [], isLoading: isLoadingPermissions } = usePermissions();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const toast = useToast();

  const showErrorToast = (error: unknown) => {
    toast.show({
      placement: 'top',
      render: ({ id }) => {
        const toastId = 'toast-' + id;
        return (
          <Toast nativeID={toastId} action="error" variant="solid">
            <ToastTitle>{getErrorMessage(error)}</ToastTitle>
          </Toast>
        );
      },
    });
  };

  useEffect(() => {
    if (role && isOpen) {
      setName(role.name);
      setDescription(role.description || '');
      setSelectedPermissions(role.permissions?.map(p => p.id) || []);
    } else if (!isOpen) {
      setName('');
      setDescription('');
      setSelectedPermissions([]);
    }
  }, [role, isOpen]);

  const handleSubmit = async () => {
    const data = {
      name,
      description,
      level: 1,
      isSystem: false,
      permissionIds: selectedPermissions,
    };

    if (role) {
      updateMutation.mutate(
        { id: role.id, ...data },
        {
          onSuccess: () => {
            onSuccess();
            onClose();
          },
          onError: (error) => {
            showErrorToast(error);
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          onSuccess();
          onClose();
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

  const groupedPermissions = permissions.reduce((acc: Record<string, Permission[]>, permission: Permission) => {
    const module = permission.module;
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <View style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.5)', 
      zIndex: 1000, 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: 20
    }}>
      <Box className="bg-white rounded-lg w-full max-w-[600px] shadow-xl overflow-hidden max-h-[90%]">
        {/* Header */}
        <HStack className="p-4 border-b border-slate-200 justify-between items-center">
          <Heading size="md">{role ? 'Edit Role' : 'Create Role'}</Heading>
          <Button variant="link" onPress={onClose} className="p-0 h-auto">
            <Icon as={CloseIcon} />
          </Button>
        </HStack>

        <VStack className="p-4 flex-1">
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="lg">
              <FormControl isRequired>
                <FormControlLabel>
                  <FormControlLabelText>Role Name</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter role name"
                  />
                </Input>
              </FormControl>

              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Description</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Enter role description"
                  />
                </Input>
              </FormControl>

              <VStack space="md" className="mb-4">
                <Heading size="sm">Permissions</Heading>
                {isLoadingPermissions ? (
                  <Text>Loading permissions...</Text>
                ) : permissions.length === 0 ? (
                  <Text size="sm" className="text-slate-400 italic">No permissions found.</Text>
                ) : (
                  Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                    <VStack key={module} space="sm" className="mb-2">
                      <Text className="font-bold text-slate-500 uppercase text-xs">
                        {module}
                      </Text>
                      <VStack space="xs">
                        {modulePermissions.map((permission) => (
                          <Checkbox
                            key={permission.id}
                            size="sm"
                            value={permission.id}
                            isChecked={selectedPermissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            aria-label={permission.id}
                          >
                            <CheckboxIndicator>
                              <CheckboxIcon as={CheckIcon} />
                            </CheckboxIndicator>
                            <CheckboxLabel className="ml-2">
                              {permission.description}
                            </CheckboxLabel>
                          </Checkbox>
                        ))}
                      </VStack>
                    </VStack>
                  ))
                )}
              </VStack>
            </VStack>
          </ScrollView>
        </VStack>

        {/* Footer */}
        <HStack className="p-4 border-t border-slate-200 justify-end space-x-3">
          <Button variant="outline" action="secondary" onPress={onClose} className="mr-3">
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button
            action="primary"
            onPress={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-brand-primary"
          >
            <ButtonText className='text-white'>
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : role
                ? 'Update Role'
                : 'Create Role'}
            </ButtonText>
          </Button>
        </HStack>
      </Box>
    </View>
  );
}