import { Document, Model, Schema, model, models } from 'mongoose';

export type AlertFrequency = 'day' | 'week' | 'month';
export type AlertCondition = 'greater' | 'less';

export interface AlertDoc extends Document {
  userId: string;
  symbol: string;
  company: string;
  alertName: string;
  alertType: 'price';
  condition: AlertCondition;
  threshold: number;
  frequency: AlertFrequency;
  createdAt: Date;
  lastTriggeredAt?: Date | null;
}

const AlertSchema = new Schema<AlertDoc>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    alertName: { type: String, required: true, trim: true },
    alertType: { type: String, enum: ['price'], default: 'price' },
    condition: { type: String, enum: ['greater', 'less'], required: true },
    threshold: { type: Number, required: true },
    frequency: { type: String, enum: ['day', 'week', 'month'], required: true },
    createdAt: { type: Date, default: Date.now },
    lastTriggeredAt: { type: Date, default: null },
  },
  { timestamps: false }
);

// Avoid duplicate alerts per user for same symbol+condition+threshold
AlertSchema.index(
  { userId: 1, symbol: 1, condition: 1, threshold: 1, frequency: 1 },
  { unique: false }
);

export const Alert: Model<AlertDoc> =
  (models?.Alert as Model<AlertDoc>) || model<AlertDoc>('Alert', AlertSchema);