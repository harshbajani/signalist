/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { connectToDatabase } from '@/database/mongoose';
import {
  Alert,
  type AlertDoc,
  type AlertFrequency,
  type AlertCondition,
} from '@/database/models/alert.model';

export type CreateAlertInput = {
  alertName: string;
  symbol: string;
  company: string;
  alertType: 'price'; // currently only price
  condition: AlertCondition; // 'greater' | 'less'
  threshold: number;
  frequency: AlertFrequency; // 'day' | 'week' | 'month'
};

export async function createAlert(userEmail: string, input: CreateAlertInput) {
  if (!userEmail) return { success: false, error: 'User email is required' };
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const user = await db
      .collection('user')
      .findOne<{ _id?: unknown; id?: string; email?: string }>({
        email: userEmail,
      });
    if (!user) return { success: false, error: 'User not found' };

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return { success: false, error: 'Invalid user id' };

    const doc = new Alert({
      userId,
      symbol: input.symbol.toUpperCase(),
      company: input.company,
      alertName: input.alertName,
      alertType: 'price',
      condition: input.condition,
      threshold: input.threshold,
      frequency: input.frequency,
    });

    await doc.save();
    return { success: true, data: sanitize(doc) };
  } catch (err) {
    console.error('createAlert error:', err);
    return { success: false, error: 'Failed to create alert' };
  }
}

export async function listAlertsByEmail(userEmail: string) {
  if (!userEmail) return [] as any[];
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const user = await db
      .collection('user')
      .findOne<{ _id?: unknown; id?: string; email?: string }>({
        email: userEmail,
      });
    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const rows = await Alert.find({ userId }).sort({ createdAt: -1 }).lean();
    return rows.map(sanitize);
  } catch (err) {
    console.error('listAlertsByEmail error:', err);
    return [];
  }
}

export async function updateAlert(userEmail: string, alertId: string, input: Partial<CreateAlertInput>) {
  if (!userEmail || !alertId) return { success: false, error: 'Missing params' };
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email: userEmail });
    if (!user) return { success: false, error: 'User not found' };

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return { success: false, error: 'Invalid user id' };

    const update: any = {};
    if (input.alertName !== undefined) update.alertName = input.alertName;
    if (input.symbol !== undefined) update.symbol = input.symbol.toUpperCase();
    if (input.company !== undefined) update.company = input.company;
    if (input.condition !== undefined) update.condition = input.condition;
    if (input.threshold !== undefined) update.threshold = input.threshold;
    if (input.frequency !== undefined) update.frequency = input.frequency;

    const res = await Alert.updateOne({ _id: alertId, userId }, { $set: update });
    return { success: res.modifiedCount > 0 };
  } catch (err) {
    console.error('updateAlert error:', err);
    return { success: false, error: 'Failed to update alert' };
  }
}

export async function deleteAlert(userEmail: string, alertId: string) {
  if (!userEmail || !alertId) return { success: false };
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const user = await db
      .collection('user')
      .findOne<{ _id?: unknown; id?: string; email?: string }>({
        email: userEmail,
      });
    if (!user) return { success: false };

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return { success: false };

    const res = await Alert.deleteOne({ _id: alertId, userId });
    return { success: res.deletedCount === 1 };
  } catch (err) {
    console.error('deleteAlert error:', err);
    return { success: false };
  }
}

function sanitize(doc: any) {
  return {
    id: String(doc._id || doc.id),
    userId: String(doc.userId),
    symbol: String(doc.symbol),
    company: String(doc.company),
    alertName: String(doc.alertName),
    alertType: 'price' as const,
    condition: doc.condition as AlertCondition,
    threshold: Number(doc.threshold),
    frequency: doc.frequency as AlertFrequency,
    createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
    lastTriggeredAt: doc.lastTriggeredAt ? new Date(doc.lastTriggeredAt) : null,
  };
}
