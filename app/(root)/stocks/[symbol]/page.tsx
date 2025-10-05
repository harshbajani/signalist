import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButtonWrapper from "@/components/WatchlistButtonWrapper";
import {
    BASELINE_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    SYMBOL_INFO_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
} from "@/lib/constants";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { checkWatchlistStatus } from "@/lib/actions/watchlist.actions";
import { redirect } from "next/navigation";

export default async function StockDetails({params}: StockDetailsPageProps) {
    const {symbol} = await params;
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
    
    // Get user session
    const session = await auth.api.getSession({headers: await headers()});
    if (!session?.user) redirect("/sign-in");
    
    // Check if stock is in user's watchlist
    const watchlistStatus = await checkWatchlistStatus(session.user.email, [symbol]);
    const isInWatchlist = watchlistStatus[symbol.toUpperCase()] || false;
    
    // Fetch company name from Finnhub API
    let companyName = symbol.toUpperCase();
    try {
        const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
        if (token) {
            const profileResponse = await fetch(
                `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${token}`,
                { cache: 'force-cache', next: { revalidate: 3600 } }
            );
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                if (profileData?.name) {
                    companyName = profileData.name;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching company name:', error);
        // Fall back to symbol if API call fails
    }

    return (
        <div className="flex min-h-screen p-4 md:p-6 lg:p-8">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Left column */}
                <div className="flex flex-col gap-6">
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}symbol-info.js`}
                        config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
                        height={170}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}advanced-chart.js`}
                        config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
                        className="custom-chart"
                        height={600}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}advanced-chart.js`}
                        config={BASELINE_WIDGET_CONFIG(symbol)}
                        className="custom-chart"
                        height={600}
                    />
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <WatchlistButtonWrapper 
                            symbol={symbol.toUpperCase()} 
                            company={companyName}
                            userEmail={session.user.email}
                            initialIsInWatchlist={isInWatchlist}
                        />
                    </div>

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}technical-analysis.js`}
                        config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
                        height={400}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}company-profile.js`}
                        config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
                        height={440}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}financials.js`}
                        config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
                        height={464}
                    />
                </div>
            </section>
        </div>
    );
}