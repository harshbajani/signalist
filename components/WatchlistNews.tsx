'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Calendar, Building2 } from 'lucide-react';

interface WatchlistNewsProps {
  news?: MarketNewsArticle[];
}

export default function WatchlistNews({ news = [] }: WatchlistNewsProps) {
    if (!news || news.length === 0) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white">Latest News</h2>
                <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8 text-center">
                    <h3 className="text-lg font-semibold mb-2 text-white">No news available</h3>
                    <p className="text-sm text-[#9CA3AF]">
                        Add stocks to your watchlist to see related market news.
                    </p>
                </div>
            </div>
        );
    }

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getStockBadgeFromRelated = (related: string) => {
    // Extract stock symbols from the related field (assuming comma-separated)
    const symbols = related?.split(',').slice(0, 3); // Show max 3 symbols
    return symbols?.filter((s) => s?.trim()) || [];
  };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">Latest News</h2>
                <Badge className="bg-[#2a2a2a] text-[#9CA3AF] border-[#2a2a2a]">
                    {news.length} {news.length === 1 ? 'Article' : 'Articles'}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {news.map((article) => (
                    <Card key={article.id} className="bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors duration-200">
                        <div className="p-4">
                            {/* Stock badge at the top */}
                            {article.related && (
                                <div className="mb-3">
                                    {getStockBadgeFromRelated(article.related).slice(0, 1).map((symbol, index) => (
                                        <span 
                                            key={index}
                                            className="inline-block bg-[#10B981] text-white px-2 py-1 rounded text-xs font-mono font-bold"
                                        >
                                            {symbol.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                            
                            {/* Title */}
                            <h3 className="text-white font-semibold text-sm line-clamp-2 leading-tight mb-3 min-h-[2.5rem]">
                                {article.headline}
                            </h3>
                            
                            {/* Source and time */}
                            <div className="flex items-center gap-2 text-xs text-[#9CA3AF] mb-3">
                                <span className="font-medium">{article.source}</span>
                                <span>•</span>
                                <span>{formatDateTime(article.datetime)}</span>
                            </div>
                            
                            {/* Summary */}
                            <p className="text-xs text-[#9CA3AF] line-clamp-3 mb-4 leading-relaxed">
                                {article.summary}
                            </p>
                            
                            {/* Footer */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[#666] lowercase">
                                    {article.category}
                                </span>
                                
                                <Link
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-[#FDD458] hover:text-[#E8BA40] transition-colors"
                                >
                                    Read More →
                                </Link>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
