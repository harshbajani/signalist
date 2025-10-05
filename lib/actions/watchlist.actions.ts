"use server";

import {connectToDatabase} from "@/database/mongoose";
import {Watchlist} from "@/database/models/watchlist.model";

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    if (!email) return [];

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        // Better Auth stores users in the "user" collection
        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({email});

        if (!user) return [];

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return [];

        const items = await Watchlist.find({userId}, {symbol: 1}).lean();
        return items.map((i) => String(i.symbol));
    } catch (err) {
        console.error('getWatchlistSymbolsByEmail error:', err);
        return [];
    }
}

export async function addToWatchlist(email: string, symbol: string, company: string): Promise<boolean> {
    if (!email || !symbol || !company) return false;

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({email});
        if (!user) return false;

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return false;

        const watchlistItem = new Watchlist({
            userId,
            symbol: symbol.toUpperCase(),
            company
        });

        await watchlistItem.save();
        return true;
    } catch (err) {
        // Ignore duplicate key errors (symbol already in watchlist)
        if ((err as any).code === 11000) {
            return false;
        }
        console.error('addToWatchlist error:', err);
        return false;
    }
}

export async function removeFromWatchlist(email: string, symbol: string): Promise<boolean> {
    if (!email || !symbol) return false;

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({email});
        if (!user) return false;

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return false;

        const result = await Watchlist.deleteOne({
            userId,
            symbol: symbol.toUpperCase()
        });

        return result.deletedCount > 0;
    } catch (err) {
        console.error('removeFromWatchlist error:', err);
        return false;
    }
}

export async function getWatchlistWithData(email: string): Promise<StockWithData[]> {
    if (!email) return [];

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({email});
        if (!user) return [];

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return [];

        const watchlistItems = await Watchlist.find({userId}).lean();
        
        if (watchlistItems.length === 0) return [];

        // Fetch stock data from Finnhub for each symbol
        const stocksWithData = await Promise.all(
            watchlistItems.map(async (item) => {
                try {
                    const [quoteData, profileData, financialsData] = await Promise.all([
                        fetchStockQuote(item.symbol),
                        fetchStockProfile(item.symbol),
                        fetchStockFinancials(item.symbol)
                    ]);

                    const currentPrice = quoteData?.c;
                    const changePercent = quoteData?.dp;
                    const marketCap = profileData?.marketCapitalization;
                    const peRatio = financialsData?.metric?.peBasicExclExtraTTM;

                    return {
                        userId: item.userId,
                        symbol: item.symbol,
                        company: item.company,
                        addedAt: item.addedAt,
                        currentPrice,
                        changePercent,
                        priceFormatted: currentPrice ? `$${currentPrice.toFixed(2)}` : 'N/A',
                        changeFormatted: changePercent ? `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%` : 'N/A',
                        marketCap: marketCap ? formatMarketCap(marketCap) : 'N/A',
                        peRatio: peRatio ? peRatio.toFixed(2) : 'N/A'
                    } as StockWithData;
                } catch (error) {
                    console.error(`Error fetching data for ${item.symbol}:`, error);
                    // Return basic data even if API calls fail
                    return {
                        userId: item.userId,
                        symbol: item.symbol,
                        company: item.company,
                        addedAt: item.addedAt,
                        currentPrice: undefined,
                        changePercent: undefined,
                        priceFormatted: 'N/A',
                        changeFormatted: 'N/A',
                        marketCap: 'N/A',
                        peRatio: 'N/A'
                    } as StockWithData;
                }
            })
        );

        return stocksWithData;
    } catch (err) {
        console.error('getWatchlistWithData error:', err);
        return [];
    }
}

// Helper functions to fetch stock data
async function fetchStockQuote(symbol: string): Promise<QuoteData | null> {
    try {
        const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
        if (!token) return null;

        const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`;
        const response = await fetch(url, { cache: 'no-store' });
        
        if (!response.ok) return null;
        
        return await response.json() as QuoteData;
    } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error);
        return null;
    }
}

async function fetchStockProfile(symbol: string): Promise<ProfileData | null> {
    try {
        const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
        if (!token) return null;

        const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${token}`;
        const response = await fetch(url, { 
            cache: 'force-cache',
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        
        if (!response.ok) return null;
        
        return await response.json() as ProfileData;
    } catch (error) {
        console.error(`Error fetching profile for ${symbol}:`, error);
        return null;
    }
}

async function fetchStockFinancials(symbol: string): Promise<FinancialsData | null> {
    try {
        const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
        if (!token) return null;

        const url = `https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${token}`;
        const response = await fetch(url, { 
            cache: 'force-cache',
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        
        if (!response.ok) return null;
        
        return await response.json() as FinancialsData;
    } catch (error) {
        console.error(`Error fetching financials for ${symbol}:`, error);
        return null;
    }
}

// Helper function to format market cap
function formatMarketCap(marketCap: number): string {
    if (marketCap >= 1000000) {
        return `$${(marketCap / 1000000).toFixed(1)}T`;
    } else if (marketCap >= 1000) {
        return `$${(marketCap / 1000).toFixed(1)}B`;
    } else {
        return `$${marketCap.toFixed(1)}M`;
    }
}

export async function checkWatchlistStatus(email: string, symbols: string[]): Promise<Record<string, boolean>> {
    if (!email || !symbols.length) return {};

    try {
        const watchlistSymbols = await getWatchlistSymbolsByEmail(email);
        const statusMap: Record<string, boolean> = {};
        
        symbols.forEach(symbol => {
            statusMap[symbol.toUpperCase()] = watchlistSymbols.includes(symbol.toUpperCase());
        });
        
        return statusMap;
    } catch (error) {
        console.error('Error checking watchlist status:', error);
        return {};
    }
}
