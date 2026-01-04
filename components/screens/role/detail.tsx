import ActionDrawer from "@/components/action-drawer";
import { Box, HStack, Text, VStack } from "@/components/ui";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from "@/components/ui/actionsheet";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import useBreakpoint from "@/hooks/use-breakpoint";
import { useRole } from "@/lib/api/roles";
import { useActionDrawerStore } from "@/stores/action-drawer";
import { useState } from "react";

export default function RoleDetail() {
  const { dataId: roleId, setShowActionDrawer } = useActionDrawerStore();
  const { sm } = useBreakpoint();
  const [showActionsheet, setShowActionsheet] = useState<boolean>(false);

  const { data: role } = useRole(roleId || "");

  const handleClose = () => setShowActionsheet(false);

  return (
    <ActionDrawer
      actionType="ROLE-DETAIL"
      header="DETAIL ROLE"
      action={
        <HStack space="sm">
          <Pressable
            className="p-6"
            onPress={() => setShowActionsheet(true)}
          >
            <SolarIconBold
              name="MenuDots"
              size={20}
              color="#FDFBF9"
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </Pressable>

          <Actionsheet isOpen={showActionsheet} onClose={handleClose}>
            <ActionsheetBackdrop />
            <ActionsheetContent className="px-0">
              <ActionsheetDragIndicatorWrapper>
                <ActionsheetDragIndicator />
              </ActionsheetDragIndicatorWrapper>
              
              <ActionsheetItem
                onPress={() => {
                  handleClose();

                  setTimeout(() => {
                    setShowActionDrawer("ROLE-EDIT");
                  }, 100);
                }}
              >
                <HStack className="w-full justify-between items-center px-4 py-2">
                  <ActionsheetItemText className="font-bold">Edit</ActionsheetItemText>
                  <SolarIconBold name="Pen" size={16} />
                </HStack>
              </ActionsheetItem>

              <ActionsheetItem
                onPress={() => {
                  handleClose();
                }}
              >
                <HStack className="w-full justify-between items-center px-4 py-2">
                  <ActionsheetItemText className="font-bold text-red-500">
                    Delete
                  </ActionsheetItemText>
                  <SolarIconBold name="TrashBin2" size={16} color="#ef4444" />
                </HStack>
              </ActionsheetItem>
            </ActionsheetContent>
          </Actionsheet>
        </HStack>
      }
    >
      <Box
        className={`p-4 border-b grid gap-4${
          sm ? " grid-cols-2" : " grid-cols-1"
        }`}
      >
        <VStack>
          <Text className="text-gray-500 font-bold">Nama Role</Text>
          <Text>{role?.name}</Text>
        </VStack>
        <VStack>
          <Text className="text-gray-500 font-bold">Deskripsi</Text>
          <Text>{role?.description}</Text>
        </VStack>
        <VStack className="col-span-2">
          <Text className="text-gray-500 font-bold">Izin Akses</Text>
          <Box
            className={`p-4 border rounded-md grid gap-4${
              sm ? " grid-cols-2" : " grid-cols-1"
            }`}
          >
            {role?.permissions?.map((permission) => (
              <Text key={permission.id} className="font-semibold capitalize">
                {permission.name}
              </Text>
            ))}
          </Box>
        </VStack>
      </Box>
    </ActionDrawer>
  );
}
