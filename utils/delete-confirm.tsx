import { Text } from '@/components/ui/text';

export function bulkDeleteConfirm(entityLabel: string, selectedItems: { id: string }[] | null) {
  return {
    ids: selectedItems?.map((m) => m.id) || [],
    title: `HAPUS ${entityLabel.toUpperCase()}`,
    description: (
      <Text className="text-slate-500">
        {`Apakah Anda yakin ingin menghapus `}
        <Text className="font-bold text-slate-900">{selectedItems?.length ?? 0}</Text>
        {` ${entityLabel}? Tindakan ini tidak dapat dibatalkan.`}
      </Text>
    ),
  };
}

export function singleDeleteConfirm(entityLabel: string, id: string, itemName?: string) {
  return {
    id,
    title: `HAPUS ${entityLabel.toUpperCase()}`,
    description: itemName ? (
      <Text className="text-slate-500">
        {`Apakah Anda yakin ingin menghapus ${entityLabel} `}
        <Text className="font-bold text-slate-900">{itemName}</Text>
        {`? Tindakan ini tidak dapat dibatalkan.`}
      </Text>
    ) : (
      <Text className="text-slate-500">
        {`Apakah Anda yakin ingin menghapus ${entityLabel} ini? Tindakan ini tidak dapat dibatalkan.`}
      </Text>
    ),
  };
}
