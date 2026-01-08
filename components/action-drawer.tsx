import {
  ActionDrawerState,
  useActionDrawerStore,
} from "@/stores/action-drawer";
import { ArrowLeftIcon, HStack, Icon, Text } from "./ui";
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "./ui/drawer";
import { Pressable } from "./ui/pressable";

export default function ActionDrawer({
  actionType,
  action,
  children,
  header,
  onClose,
  footer,
}: {
  actionType: ActionDrawerState["showActionDrawer"];
  action?: React.ReactNode;
  children?: React.ReactNode;
  header?: React.ReactNode;
  onClose?: () => void;
  footer?: React.ReactNode;
}) {
  const { showActionDrawer, setShowActionDrawer, setDataId } = useActionDrawerStore();
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setShowActionDrawer(null);
      setDataId(null);
    }
  };
  
  return (
    <Drawer
      isOpen={showActionDrawer === actionType}
      size="full"
      anchor="left"
      onClose={handleClose}
    >
      <DrawerBackdrop />
      <DrawerContent className="p-0">
        <DrawerHeader className="relative">
          <HStack className="bg-brand-primary flex-1">
            <Pressable onPress={handleClose} className="p-6">
              <Icon
                as={ArrowLeftIcon}
                size="xl"
                className="text-brand-primary-forground"
              />
            </Pressable>
            <HStack className="flex-1 justify-center items-center">
              <Text className="text-brand-primary-forground font-bold">
                {header}
              </Text>
            </HStack>
            {action ? action : <HStack space="sm" className="w-[72px]"></HStack>}
          </HStack>
        </DrawerHeader>
        <DrawerBody className="flex-1 mt-0 mb-0">{children}</DrawerBody>
        {footer && (
          <DrawerFooter>
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
