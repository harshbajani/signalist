'use client';

import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export default function AlertDeleteButton({
  userEmail,
  alertId,
}: {
  userEmail: string;
  alertId: string;
}) {
  const onDelete = async () => {
    try {
      const { deleteAlert } = await import('@/lib/actions/alert.actions');
      const res = await deleteAlert(userEmail, alertId);
      if (res?.success) {
        toast.success('Alert deleted');
        if (typeof window !== 'undefined') window.location.reload();
      } else {
        toast.error('Failed to delete alert');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete alert');
    }
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      className="h-8 w-8 p-0 inline-flex items-center justify-center rounded hover:text-[#EF4444]"
      title="Delete alert"
      aria-label="Delete alert"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
