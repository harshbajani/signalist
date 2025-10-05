'use client';

import { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Loader2, Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { searchStocksWithWatchlistStatus } from '@/lib/actions/finnhub.actions';
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';

export default function SearchCommand({
  renderAs = 'button',
  label = 'Add stock',
  initialStocks,
  userEmail,
  className,
}: SearchCommandProps & { userEmail?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] =
    useState<StockWithWatchlistStatus[]>(initialStocks);

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSearch = async () => {
    if (!isSearchMode) return setStocks(initialStocks);

    setLoading(true);
    try {
      const results = await searchStocksWithWatchlistStatus(searchTerm.trim(), userEmail);
      setStocks(results);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm]);

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm('');
    setStocks(initialStocks);
  };

  const handleWatchlistToggle = async (e: React.MouseEvent, stock: StockWithWatchlistStatus, userEmail?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!userEmail) {
      toast.error('Please sign in to manage your watchlist');
      return;
    }

    try {
      let success = false;
      if (stock.isInWatchlist) {
        success = await removeFromWatchlist(userEmail, stock.symbol);
        if (success) {
          toast.success(`Removed ${stock.symbol} from watchlist`);
          // Update local state
          setStocks(prev => 
            prev.map(s => 
              s.symbol === stock.symbol 
                ? { ...s, isInWatchlist: false }
                : s
            )
          );
        } else {
          toast.error('Failed to remove from watchlist');
        }
      } else {
        success = await addToWatchlist(userEmail, stock.symbol, stock.name);
        if (success) {
          toast.success(`Added ${stock.symbol} to watchlist`);
          // Update local state
          setStocks(prev => 
            prev.map(s => 
              s.symbol === stock.symbol 
                ? { ...s, isInWatchlist: true }
                : s
            )
          );
        } else {
          toast.error('Failed to add to watchlist');
        }
      }
    } catch (error) {
      console.error('Watchlist toggle error:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      {renderAs === 'text' ? (
        <span onClick={() => setOpen(true)} className="search-text">
          {label}
        </span>
      ) : (
        <Button onClick={() => setOpen(true)} className={className || "search-btn"}>
          {label}
        </Button>
      )}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="search-dialog"
      >
        <div className="search-field">
          <CommandInput
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Search stocks..."
            className="search-input"
          />
          {loading && <Loader2 className="search-loader" />}
        </div>
        <CommandList className="search-list">
          {loading ? (
            <CommandEmpty className="search-list-empty">
              Loading stocks...
            </CommandEmpty>
          ) : displayStocks?.length === 0 ? (
            <div className="search-list-indicator">
              {isSearchMode ? 'No results found' : 'No stocks available'}
            </div>
          ) : (
            <ul>
              <div className="search-count">
                {isSearchMode ? 'Search results' : 'Popular stocks'}
                {` `}({displayStocks?.length || 0})
              </div>
              {displayStocks?.map((stock, i) => (
                <li key={stock.symbol} className="search-item">
                  <Link
                    href={`/stocks/${stock.symbol}`}
                    onClick={handleSelectStock}
                    className="search-item-link"
                  >
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <div className="search-item-name">{stock.name}</div>
                      <div className="text-sm text-gray-500">
                        {stock.symbol} | {stock.exchange} | {stock.type}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleWatchlistToggle(e, stock, userEmail)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title={stock.isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      <Star 
                        className={`h-4 w-4 transition-colors ${
                          stock.isInWatchlist 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-400 hover:text-yellow-400'
                        }`} 
                      />
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
