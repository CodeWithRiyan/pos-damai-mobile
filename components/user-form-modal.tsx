import { getErrorMessage } from '@/lib/api/client';
import { Role, useRoles } from '@/lib/api/roles';
import { User, useCreateUser, useUpdateUser } from '@/lib/api/users';
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

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSuccess: () => void;
}

export function UserFormModal({ isOpen, onClose, user, onSuccess }: UserFormModalProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const { data: roles = [], isLoading: isLoadingRoles } = useRoles();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
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
    if (user && isOpen) {
      setUsername(user.username);
      setEmail(user.email || '');
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setRoleId(user.roleId || (user.role as any)?.id || '');
      setIsActive(user.isActive);
      setPassword('');
    } else if (!isOpen) {
      setUsername('');
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setRoleId('');
      setIsActive(true);
    }
  }, [user, isOpen]);

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
          onSuccess();
          onClose();
        },
        onError: (error) => {
          showErrorToast(error);
        },
      });
    } else {
      data.password = password;
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
          <Heading size="md">{user ? 'Edit User' : 'Create User'}</Heading>
          <Button variant="link" onPress={onClose} className="p-0 h-auto">
            <Icon as={CloseIcon} />
          </Button>
        </HStack>

        <VStack className="p-4 flex-1">
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="lg">
              <FormControl isRequired>
                <FormControlLabel>
                  <FormControlLabelText>Username</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter username"
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
                    onChangeText={setEmail}
                    placeholder="Enter email address"
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
                      onChangeText={setPassword}
                      placeholder="Enter password"
                      type="password"
                    />
                  </Input>
                </FormControl>
              )}

              <FormControl isRequired>
                <FormControlLabel>
                  <FormControlLabelText>First Name</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First name"
                  />
                </Input>
              </FormControl>

              <FormControl isRequired>
                <FormControlLabel>
                  <FormControlLabelText>Last Name</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last name"
                  />
                </Input>
              </FormControl>

              <FormControl isRequired>
                <FormControlLabel>
                  <FormControlLabelText>Phone</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter phone number"
                  />
                </Input>
              </FormControl>

              <VStack space="md" className="mb-4">
                <Heading size="sm">Select Role</Heading>
                {isLoadingRoles ? (
                  <Text size="sm">Loading roles...</Text>
                ) : roles.length === 0 ? (
                  <Text size="sm" className="text-slate-400 italic">No roles found.</Text>
                ) : (
                  <VStack space="xs">
                    {roles.map((role: Role) => (
                      <Checkbox
                        key={role.id}
                        size="sm"
                        value={role.id}
                        isChecked={roleId === role.id}
                        onChange={() => setRoleId(role.id)}
                        aria-label={role.name}
                      >
                        <CheckboxIndicator>
                          <CheckboxIcon as={CheckIcon} />
                        </CheckboxIndicator>
                        <CheckboxLabel className="ml-2">
                          {role.name}
                        </CheckboxLabel>
                      </Checkbox>
                    ))}
                  </VStack>
                )}
              </VStack>

              {user && (
                <VStack space="sm" className="mb-4">
                  <Heading size="sm">Status</Heading>
                  <Checkbox
                    size="sm"
                    value="active"
                    isChecked={isActive}
                    onChange={(checked) => setIsActive(checked)}
                    aria-label="Active Account"
                  >
                    <CheckboxIndicator>
                      <CheckboxIcon as={CheckIcon} />
                    </CheckboxIndicator>
                    <CheckboxLabel className="ml-2">
                      Active Account
                    </CheckboxLabel>
                  </Checkbox>
                </VStack>
              )}
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
                : user
                ? 'Update User'
                : 'Create User'}
            </ButtonText>
          </Button>
        </HStack>
      </Box>
    </View>
  );
}
