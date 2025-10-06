/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import InputField from '@/components/forms/InputField';
import SelectField from '@/components/forms/SelectField';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export type CreateAlertFormValues = {
  alertName: string;
  symbol: string;
  company: string;
  alertType: 'price' | 'volume';
  condition: 'greater' | 'less';
  threshold: string;
  frequency: 'day' | 'week' | 'month';
};

export default function CreateAlertForm({
  userEmail,
  stocks,
  defaultSymbol,
  defaultCompany,
  onSuccess,
  mode = 'create',
  alertId,
  initialValues,
}: {
  userEmail: string;
  stocks: Array<{ symbol: string; company: string }>;
  defaultSymbol?: string;
  defaultCompany?: string;
  onSuccess?: () => void;
  mode?: 'create' | 'edit';
  alertId?: string;
  initialValues?: Partial<CreateAlertFormValues>;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateAlertFormValues>({
    defaultValues: {
      alertName: initialValues?.alertName ?? '',
      symbol: initialValues?.symbol ?? defaultSymbol ?? '',
      company: initialValues?.company ?? defaultCompany ?? '',
      alertType: 'price',
      condition: (initialValues?.condition as any) ?? 'greater',
      threshold: initialValues?.threshold ?? '',
      frequency: (initialValues?.frequency as any) ?? 'day',
    },
  });

  const symbolOptions = useMemo(
    () =>
      stocks.map((s) => ({
        value: s.symbol,
        label: `${s.company} (${s.symbol})`,
      })),
    [stocks]
  );

  const frequencyOptions = [
    { value: 'day', label: 'Once per day' },
    { value: 'week', label: 'Once per week' },
    { value: 'month', label: 'Once per month' },
  ] as const;

  const conditionOptions = [
    { value: 'greater', label: 'Greater than (>)' },
    { value: 'less', label: 'Less than (<)' },
  ] as const;

  // Keep company in sync based on selected symbol
  const selected = watch('symbol');
  useEffect(() => {
    const match = stocks.find((s) => s.symbol === selected);
    if (match) setValue('company', match.company);
  }, [selected, stocks, setValue]);

  const onSubmit = async (values: CreateAlertFormValues) => {
    try {
      const { createAlert, updateAlert } = await import(
        '@/lib/actions/alert.actions'
      );
      const thresholdNumber = Number(values.threshold);
      if (!Number.isFinite(thresholdNumber)) {
        toast.error('Please enter a valid threshold value');
        return;
      }
      const payload = {
        alertName: values.alertName,
        symbol: values.symbol,
        company: values.company,
        alertType: 'price' as const,
        condition: values.condition,
        threshold: thresholdNumber,
        frequency: values.frequency,
      };
      let ok = false;
      if (mode === 'edit' && alertId) {
        const res = await updateAlert(userEmail, alertId, payload as any);
        ok = !!res?.success;
      } else {
        const res = await createAlert(userEmail, payload);
        ok = !!res?.success;
      }
      if (ok) {
        toast.success(mode === 'edit' ? 'Alert updated' : 'Alert created');
        onSuccess?.();
      } else {
        toast.error('Failed to save alert');
      }
    } catch (err) {
      console.error('create alert error', err);
      toast.error('Failed to create alert');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        <InputField
          name="alertName"
          label="Alert Name"
          placeholder="Apple at Discount"
          register={register as any}
          validation={{ required: 'Please enter an alert name' }}
          error={errors.alertName as any}
        />

        <SelectField
          name="symbol"
          label="Stock identifier"
          placeholder="Apple Inc (AAPL)"
          options={symbolOptions}
          control={control as any}
          required
          error={errors.symbol as any}
        />


        <SelectField
          name="alertType"
          label="Alert type"
          placeholder="Price"
          options={[{ value: 'price', label: 'Price' }]}
          control={control as any}
          required
          error={errors.alertType as any}
        />

        <SelectField
          name="condition"
          label="Condition"
          placeholder="Greater than (>)"
          options={conditionOptions as any}
          control={control as any}
          required
          error={errors.condition as any}
        />

        <InputField
          name="threshold"
          label="Threshold value"
          placeholder="$ eg: 140"
          type="number"
          register={register as any}
          validation={{ required: 'Please enter a threshold value' }}
          error={errors.threshold as any}
        />

        <SelectField
          name="frequency"
          label="Frequency"
          placeholder="Once per day"
          options={frequencyOptions as any}
          control={control as any}
          required
          error={errors.frequency as any}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="submit"
          className="bg-yellow-400 text-black hover:bg-yellow-500"
        >
          {mode === 'edit' ? 'Save Changes' : 'Create Alert'}
        </Button>
      </div>
    </form>
  );
}
