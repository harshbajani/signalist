'use client';

import React from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { WATCHLIST_TABLE_HEADER } from '@/lib/constants';
import { toast } from 'sonner';
import AlertCreateDialog from './AlertCreateDialog';

interface WatchlistTableProps {
  watchlist: StockWithData[];
  userEmail?: string;
}

export default function WatchlistTable({
  watchlist,
  userEmail,
}: WatchlistTableProps) {
  const handleRemoveFromWatchlist = async (symbol: string) => {
    if (!userEmail) {
      console.error('User email is required to remove from watchlist');
      return;
    }

    try {
      const { removeFromWatchlist } = await import(
        '@/lib/actions/watchlist.actions'
      );
      const success = await removeFromWatchlist(userEmail, symbol);

      if (success) {
        toast.success(`Removed ${symbol} from watchlist`);
        // Refresh the page to update the table
        window.location.reload();
      } else {
        toast.error(`Failed to remove ${symbol} from watchlist`);
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleCreateAlert = (symbol: string, company: string) => {
    // handled by AlertCreateDialog component via its trigger
  };

  if (!watchlist || watchlist.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8 text-center">
        <h3 className="text-lg font-semibold mb-2 text-white">
          Your watchlist is empty
        </h3>
        <p className="text-sm text-[#9CA3AF] mb-4">
          Add stocks to your watchlist to track their performance and get
          alerts.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden max-h-[1030px] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-[#2a2a2a] hover:bg-transparent">
            {WATCHLIST_TABLE_HEADER.map((header) => (
              <TableHead
                key={header}
                className="font-semibold text-[#9CA3AF] bg-[#141414] h-12"
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {watchlist.map((stock) => (
            <TableRow
              key={stock.symbol}
              className="border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors"
            >
              {/* Company */}
              <TableCell className="font-medium text-white py-4">
                <div className="flex items-center gap-2">
                  <span className="text-[#FDD458]">★</span>
                  <Link
                    href={`/stocks/${stock.symbol}`}
                    className="hover:text-[#FDD458] transition-colors"
                  >
                    {stock.company}
                  </Link>
                </div>
              </TableCell>

              {/* Symbol */}
              <TableCell className="py-4">
                <span className="font-mono font-medium text-[#CCCCCC]">
                  {stock.symbol}
                </span>
              </TableCell>

              {/* Price */}
              <TableCell className="font-mono text-white py-4">
                {stock.priceFormatted}
              </TableCell>

              {/* Change */}
              <TableCell className="py-4">
                <span
                  className={
                    stock.changePercent === undefined
                      ? 'text-[#9CA3AF] bg-[#2a2a2a] px-2 py-1 rounded text-sm'
                      : stock.changePercent >= 0
                      ? 'text-[#10B981]  px-2 py-1 rounded text-sm font-medium'
                      : 'text-[#EF4444]  px-2 py-1 rounded text-sm font-medium'
                  }
                >
                  {stock.changeFormatted}
                </span>
              </TableCell>

              {/* Market Cap */}
              <TableCell className="font-mono text-[#CCCCCC] py-4">
                {stock.marketCap}
              </TableCell>

              {/* P/E Ratio */}
              <TableCell className="font-mono text-[#CCCCCC] py-4">
                {stock.peRatio}
              </TableCell>

              {/* Alert */}
              <TableCell className="py-4">
                <div className="inline-block">
                  {/* Dialog trigger per row */}
                  <AlertCreateDialog
                    userEmail={userEmail || ''}
                    stocks={watchlist.map((w) => ({
                      symbol: w.symbol,
                      company: w.company,
                    }))}
                    defaultSymbol={stock.symbol}
                    defaultCompany={stock.company}
                    label="Add Alert"
                    className="bg-[#FF6B35] hover:bg-[#FF6B35]/80 text-white text-xs px-3 py-1.5 h-auto"
                  />
                </div>
              </TableCell>

              {/* Action */}
              <TableCell className="py-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveFromWatchlist(stock.symbol)}
                  className="h-8 w-8 p-0 hover:bg-[#EF4444]/20 hover:text-[#EF4444] text-[#9CA3AF]"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove from watchlist</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
