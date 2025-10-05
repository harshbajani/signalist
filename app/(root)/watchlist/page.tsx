import React from 'react';
import WatchlistTable from '@/components/WatchlistTable';
import WatchlistNews from '@/components/WatchlistNews';
import SearchCommand from '@/components/SearchCommand';
import { getWatchlistWithData } from '@/lib/actions/watchlist.actions';
import { getNews, searchStocks } from '@/lib/actions/finnhub.actions';
import { auth } from '@/lib/better-auth/auth';
import { Button } from '@/components/ui/button';

export default async function WatchlistPage() {
  const session = await auth.api.getSession({
    headers: await import('next/headers').then((h) => h.headers()),
  });

  if (!session?.user?.email) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Watchlist</h1>
        <p className="text-gray-600">Please sign in to view your watchlist.</p>
      </div>
    );
  }

  const [watchlistData, watchlistNews, initialStocks] = await Promise.all([
    getWatchlistWithData(session.user.email),
    getWatchlistWithData(session.user.email).then(async (stocks) => {
      const symbols = stocks.map((stock) => stock.symbol);
      return symbols.length > 0 ? getNews(symbols) : [];
    }),
    searchStocks(),
  ]);

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Table and Alerts headers with buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-4">
          {/* Table header with Add Stock button */}
          <div className="lg:col-span-3 items-center">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-white">Watchlist</h1>
              <SearchCommand
                renderAs="button"
                label="Add Stock"
                initialStocks={initialStocks}
                userEmail={session.user.email}
                className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors cursor-pointer"
              />
            </div>
          </div>

          {/* Alerts header with Create Alert button */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white">Alerts</h1>
              <Button className="bg-yellow-400 text-black px-3 py-2 rounded-lg text-sm font-medium hover:bg-yellow-500 transition-colors cursor-pointer">
                Create Alert
              </Button>
            </div>
          </div>
        </div>

        {/* Main content - Table and Alerts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Watchlist table - takes up 3/4 of the space */}
          <div className="lg:col-span-3">
            <WatchlistTable
              watchlist={watchlistData}
              userEmail={session.user.email}
            />
          </div>

          {/* Alerts sidebar - takes up 1/4 of the space */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6 h-fit">
              <p className="text-[#9CA3AF] text-sm leading-relaxed">
                No alerts created yet. Set up alerts for your stocks to get
                notified of price changes.
              </p>
            </div>
          </div>
        </div>

        {/* News section below */}
        <WatchlistNews news={watchlistNews} />
      </div>
    </div>
  );
}
