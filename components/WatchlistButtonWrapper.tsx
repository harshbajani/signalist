'use client';

import React, { useState } from 'react';
import WatchlistButton from '@/components/WatchlistButton';
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { toast } from 'sonner';

interface WatchlistButtonWrapperProps {
    symbol: string;
    company: string;
    userEmail: string;
    initialIsInWatchlist: boolean;
}

export default function WatchlistButtonWrapper({ 
    symbol, 
    company, 
    userEmail, 
    initialIsInWatchlist 
}: WatchlistButtonWrapperProps) {
    const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist);

    const handleWatchlistChange = async (symbol: string, isAdded: boolean) => {
        if (!userEmail) {
            toast.error('Please sign in to manage your watchlist');
            return;
        }

        try {
            let success = false;
            
            if (isAdded) {
                success = await addToWatchlist(userEmail, symbol, company);
                if (success) {
                    setIsInWatchlist(true);
                    toast.success(`Added ${symbol} to watchlist`);
                } else {
                    toast.error('Failed to add to watchlist');
                }
            } else {
                success = await removeFromWatchlist(userEmail, symbol);
                if (success) {
                    setIsInWatchlist(false);
                    toast.success(`Removed ${symbol} from watchlist`);
                } else {
                    toast.error('Failed to remove from watchlist');
                }
            }
        } catch (error) {
            console.error('Watchlist operation error:', error);
            toast.error('Something went wrong. Please try again.');
        }
    };

    return (
        <WatchlistButton
            symbol={symbol}
            company={company}
            isInWatchlist={isInWatchlist}
            onWatchlistChange={handleWatchlistChange}
        />
    );
}
