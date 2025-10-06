/* eslint-disable @typescript-eslint/no-explicit-any */
import { inngest } from '@/lib/inngest/client';
import { Alert } from '@/database/models/alert.model';
import { connectToDatabase } from '@/database/mongoose';
import {
  sendStockAlertLowerEmail,
  sendStockAlertUpperEmail,
} from '@/lib/nodemailer';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const TOKEN =
  process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

async function fetchQuote(symbol: string) {
  if (!TOKEN) return null;
  try {
    const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(
      symbol
    )}&token=${TOKEN}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as { c?: number };
  } catch {
    return null;
  }
}

async function evaluateAndSend(alert: any, email: string) {
  const quote = await fetchQuote(alert.symbol);
  if (!quote?.c || !Number.isFinite(alert.threshold)) return false;

  const current = quote.c as number;
  const target = alert.threshold as number;
  const isUpper = alert.condition === 'greater';
  const shouldTrigger = isUpper ? current > target : current < target;
  if (!shouldTrigger) return false;

  const timestamp = new Date().toUTCString();
  const payload = {
    email,
    symbol: alert.symbol,
    company: alert.company,
    currentPrice: `$${current.toFixed(2)}`,
    targetPrice: `$${target.toFixed(2)}`,
    timestamp,
  };
  if (isUpper) {
    await sendStockAlertUpperEmail(payload);
  } else {
    await sendStockAlertLowerEmail(payload);
  }

  // mark as triggered now
  await Alert.updateOne(
    { _id: alert.id ?? alert._id },
    { $set: { lastTriggeredAt: new Date() } }
  );
  return true;
}

async function getAlertsByFrequency(freq: 'day' | 'week' | 'month') {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection not found');

  // join with users to get email addresses
  const pipeline: any[] = [
    { $match: { frequency: freq } },
    {
      $lookup: {
        from: 'user',
        localField: 'userId',
        foreignField: 'id',
        as: 'userA',
      },
    },
    {
      $lookup: {
        from: 'user',
        localField: 'userId',
        foreignField: '_id',
        as: 'userB',
      },
    },
    {
      $addFields: {
        user: {
          $ifNull: [
            { $arrayElemAt: ['$userA', 0] },
            { $arrayElemAt: ['$userB', 0] },
          ],
        },
      },
    },
    { $project: { alert: '$$ROOT', email: '$user.email' } },
  ];

  const rows = await (Alert as any).aggregate(pipeline).exec();
  return rows as Array<{ alert: any; email: string }>;
}

export const sendPriceAlertsDaily = inngest.createFunction(
  { id: 'price-alerts-daily' },
  [{ cron: '0 13 * * *' }],
  async ({ step }) => {
    const rows = await step.run('fetch-daily-alerts', async () =>
      getAlertsByFrequency('day')
    );
    for (const row of rows) {
      if (!row?.email) continue;
      await step.run(`eval-${row.alert._id}`, async () =>
        evaluateAndSend({ ...row.alert, id: row.alert._id }, row.email)
      );
    }
    return { success: true };
  }
);

export const sendPriceAlertsWeekly = inngest.createFunction(
  { id: 'price-alerts-weekly' },
  [{ cron: '0 13 * * 1' }], // Mondays 13:00 UTC
  async ({ step }) => {
    const rows = await step.run('fetch-weekly-alerts', async () =>
      getAlertsByFrequency('week')
    );
    for (const row of rows) {
      if (!row?.email) continue;
      await step.run(`eval-${row.alert._id}`, async () =>
        evaluateAndSend({ ...row.alert, id: row.alert._id }, row.email)
      );
    }
    return { success: true };
  }
);

export const sendPriceAlertsMonthly = inngest.createFunction(
  { id: 'price-alerts-monthly' },
  [{ cron: '0 13 1 * *' }], // 1st of each month 13:00 UTC
  async ({ step }) => {
    const rows = await step.run('fetch-monthly-alerts', async () =>
      getAlertsByFrequency('month')
    );
    for (const row of rows) {
      if (!row?.email) continue;
      await step.run(`eval-${row.alert._id}`, async () =>
        evaluateAndSend({ ...row.alert, id: row.alert._id }, row.email)
      );
    }
    return { success: true };
  }
);
