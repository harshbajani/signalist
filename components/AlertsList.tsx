/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { listAlertsByEmail } from '@/lib/actions/alert.actions';
import { formatPrice } from '@/lib/utils';
import AlertCreateDialog from '@/components/AlertCreateDialog';
import AlertDeleteButton from '@/components/AlertDeleteButton';
import { fetchJSON } from '@/lib/actions/finnhub.actions';
import { Pencil } from 'lucide-react';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const TOKEN =
  process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

async function getQuote(
  symbol: string
): Promise<{ c?: number; dp?: number } | null> {
  if (!TOKEN) return null;
  try {
    return await fetchJSON(
      `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(
        symbol
      )}&token=${TOKEN}`
    );
  } catch {
    return null;
  }
}

async function getProfile(
  symbol: string
): Promise<{ name?: string; logo?: string } | null> {
  if (!TOKEN) return null;
  try {
    return await fetchJSON(
      `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(
        symbol
      )}&token=${TOKEN}`
    );
  } catch {
    return null;
  }
}

export default async function AlertsList({ userEmail }: { userEmail: string }) {
  const rows = await listAlertsByEmail(userEmail);

  const enriched = await Promise.all(
    (rows || []).map(async (a: any) => {
      const [quote, profile] = await Promise.all([
        getQuote(a.symbol),
        getProfile(a.symbol),
      ]);
      return {
        ...a,
        currentPrice: quote?.c,
        changePercent: quote?.dp,
        company: a.company || profile?.name || a.symbol,
        logo: (profile as any)?.logo || null,
      };
    })
  );

  const freqLabel = (f: string) =>
    f === 'day'
      ? 'Once per day'
      : f === 'week'
      ? 'Once per week'
      : 'Once per month';
  const changeColor = (dp?: number) =>
    typeof dp === 'number'
      ? dp >= 0
        ? 'text-[#10B981]'
        : 'text-[#EF4444]'
      : 'text-[#9CA3AF]';

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-4 min-h-[420px] max-h-[1030px] overflow-y-auto">
      {(!enriched || enriched.length === 0) && (
        <p className="text-[#9CA3AF] text-sm">
          No alerts created yet. Set up alerts for your stocks to get notified
          of price changes.
        </p>
      )}

      <div className="space-y-3">
        {enriched?.map((a: any) => (
          <div
            key={a.id}
            className="bg-[#141414] border border-[#2a2a2a] rounded-md p-4"
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: Logo + Company + price */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-[#1f1f1f] flex items-center justify-center overflow-hidden">
                      {a.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.logo}
                          alt={`${a.symbol} logo`}
                          className="h-8 w-8 object-contain"
                        />
                      ) : (
                        <span className="text-[#FDD458] font-bold">★</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">
                        {a.company}
                      </div>
                      <div className="text-xs text-[#9CA3AF] font-mono">
                        {a.symbol}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium font-mono">
                      {typeof a.currentPrice === 'number'
                        ? `$${a.currentPrice.toFixed(2)}`
                        : '—'}
                    </div>
                    <div
                      className={`text-xs font-medium ${changeColor(
                        a.changePercent
                      )}`}
                    >
                      {typeof a.changePercent === 'number'
                        ? `${
                            a.changePercent >= 0 ? '+' : ''
                          }${a.changePercent.toFixed(2)}%`
                        : ''}
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#2a2a2a] my-3" />

                <div className="flex items-center justify-between">
                  <div className="text-[#9CA3AF] text-sm mb-1">Alert:</div>
                  <div className="flex  items-end gap-2">
                    {/* Edit trigger opens dialog with filled values */}
                    <AlertCreateDialog
                      userEmail={userEmail}
                      stocks={enriched.map((e: any) => ({
                        symbol: e.symbol,
                        company: e.company,
                      }))}
                      mode="edit"
                      alertId={a.id}
                      initialValues={{
                        alertName: a.alertName,
                        symbol: a.symbol,
                        company: a.company,
                        condition: a.condition,
                        threshold: String(a.threshold),
                        frequency: a.frequency,
                        alertType: 'price',
                      }}
                      trigger={
                        <button
                          className="h-8 w-8 p-0 inline-flex items-center justify-center "
                          title="Edit alert"
                          aria-label="Edit alert"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      }
                    />

                    <AlertDeleteButton userEmail={userEmail} alertId={a.id} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-white font-semibold w-full">
                    {a.condition === 'greater' ? 'Price > ' : 'Price < '}
                    {formatPrice(Number(a.threshold) || 0)}
                  </div>

                  <div className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded w-full text-center">
                    {freqLabel(a.frequency)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
