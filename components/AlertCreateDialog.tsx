'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CreateAlertForm, { CreateAlertFormValues } from '@/components/forms/CreateAlertForm';

export default function AlertCreateDialog({
  userEmail,
  stocks,
  label = 'Create Alert',
  defaultSymbol,
  defaultCompany,
  variant = 'button',
  className,
  mode = 'create',
  alertId,
  initialValues,
  trigger,
}: {
  userEmail: string;
  stocks: Array<{ symbol: string; company: string }>;
  label?: string;
  defaultSymbol?: string;
  defaultCompany?: string;
  variant?: 'button' | 'link';
  className?: string;
  mode?: 'create' | 'edit';
  alertId?: string;
  initialValues?: Partial<CreateAlertFormValues>;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : <Button className={className}>{label}</Button>}
      </DialogTrigger>
      <DialogContent
        className="bg-[#141414] border-[#2a2a2a] text-white sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Alert' : 'Price Alert'}</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <CreateAlertForm
            userEmail={userEmail}
            stocks={stocks}
            defaultSymbol={defaultSymbol}
            defaultCompany={defaultCompany}
            onSuccess={() => {
              setOpen(false);
              if (typeof window !== 'undefined') window.location.reload();
            }}
            mode={mode}
            alertId={alertId}
            initialValues={initialValues}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
