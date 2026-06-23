'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface SizePricingItem {
  id: string;
  lengthInch: number;
  bdtPerKg: number;
  usdPerKg: number;
  marketSegment: string;
  minMarginBdt: number;
  minMarginPct: number;
}

interface BuyerPricingItem {
  id: string;
  buyer: { id: string; name: string; country: string };
  lengthInch: number;
  premiumPct: number;
}

const NAVY = '#1F3864';
const GOLD = '#C9A227';
const BASE_RATE_8INCH = 8; // Reference size for premium calculation

export default function SizePricingSection() {
  const [sizeData, setSizeData] = useState<SizePricingItem[]>([]);
  const [buyerData, setBuyerData] = useState<BuyerPricingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/size-pricing')
      .then(r => r.json())
      .then(res => {
        setSizeData(res.sizePricing || []);
        setBuyerData(res.buyerPricing || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Build a lookup map for base rates
  const baseRateMap = new Map<number, { bdtPerKg: number; usdPerKg: number }>();
  sizeData.forEach(sp => {
    baseRateMap.set(sp.lengthInch, { bdtPerKg: sp.bdtPerKg, usdPerKg: sp.usdPerKg });
  });

  // Get the 8" rate for premium calculation
  const rate8 = baseRateMap.get(8);
  const rate8Bdt = rate8?.bdtPerKg || 0;
  const rate8Usd = rate8?.usdPerKg || 0;

  const renderLoading = () => (
    <div className="space-y-2"><Skeleton className="h-8 w-full" />{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: NAVY }}>Size Pricing</h2>

      <Tabs defaultValue="rate-master" className="w-full">
        <TabsList>
          <TabsTrigger value="rate-master">A: Rate Master</TabsTrigger>
          <TabsTrigger value="buyer-pricing">B: Buyer-Specific Price List</TabsTrigger>
        </TabsList>

        {/* Section A: Rate Master */}
        <TabsContent value="rate-master">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Size Rate Master</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? renderLoading() : (
                <ScrollArea className="max-h-[500px]">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Length (inch)</TableHead>
                          <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: GOLD, backgroundColor: '#FEF9E7' }}>BDT/kg</TableHead>
                          <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>USD/kg</TableHead>
                          <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Premium vs 8"</TableHead>
                          <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Market Segment</TableHead>
                          <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Min Margin (BDT/kg)</TableHead>
                          <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Min Margin %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sizeData.length === 0 && (
                          <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No size pricing data</TableCell></TableRow>
                        )}
                        {sizeData.map(item => {
                          const premiumVs8 = rate8Bdt > 0 ? (((item.bdtPerKg - rate8Bdt) / rate8Bdt) * 100) : 0;
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="text-sm font-bold">{item.lengthInch}"</TableCell>
                              <TableCell className="text-sm text-right font-bold" style={{ color: GOLD, backgroundColor: '#FEF9E7' }}>৳{item.bdtPerKg.toLocaleString()}</TableCell>
                              <TableCell className="text-sm text-right">${item.usdPerKg.toLocaleString()}</TableCell>
                              <TableCell className="text-xs">
                                <Badge className={premiumVs8 > 0 ? 'bg-green-100 text-green-800 hover:bg-green-100' : premiumVs8 < 0 ? 'bg-red-100 text-red-800 hover:bg-red-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}>
                                  {premiumVs8 > 0 ? '+' : ''}{premiumVs8.toFixed(1)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">{item.marketSegment}</TableCell>
                              <TableCell className="text-sm text-right">৳{item.minMarginBdt.toLocaleString()}</TableCell>
                              <TableCell className="text-sm text-right">{item.minMarginPct.toFixed(1)}%</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section B: Buyer-Specific Price List */}
        <TabsContent value="buyer-pricing">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold" style={{ color: NAVY }}>Buyer-Specific Price List</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? renderLoading() : (
                <ScrollArea className="max-h-[500px]">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Buyer</TableHead>
                          <TableHead className="text-xs font-bold whitespace-nowrap" style={{ color: NAVY }}>Length</TableHead>
                          <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Base Rate (BDT/kg)</TableHead>
                          <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Premium %</TableHead>
                          <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: GOLD, backgroundColor: '#FEF9E7' }}>Final Price (BDT/kg)</TableHead>
                          <TableHead className="text-xs font-bold text-right whitespace-nowrap" style={{ color: NAVY }}>Final Price (USD/kg)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {buyerData.length === 0 && (
                          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No buyer-specific pricing data</TableCell></TableRow>
                        )}
                        {buyerData.map(bp => {
                          const baseRate = baseRateMap.get(bp.lengthInch);
                          const baseBdt = baseRate?.bdtPerKg || 0;
                          const baseUsd = baseRate?.usdPerKg || 0;
                          const finalBdt = baseBdt * (1 + (bp.premiumPct || 0) / 100);
                          const finalUsd = baseUsd * (1 + (bp.premiumPct || 0) / 100);
                          return (
                            <TableRow key={bp.id}>
                              <TableCell className="text-xs font-medium whitespace-nowrap">
                                {bp.buyer?.name || 'Unknown'}
                                <span className="text-muted-foreground ml-1">({bp.buyer?.country})</span>
                              </TableCell>
                              <TableCell className="text-xs font-bold">{bp.lengthInch}"</TableCell>
                              <TableCell className="text-xs text-right">৳{baseBdt.toLocaleString()}</TableCell>
                              <TableCell className="text-xs text-right">
                                <Badge className={bp.premiumPct > 0 ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}>
                                  {bp.premiumPct > 0 ? '+' : ''}{bp.premiumPct.toFixed(1)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-right font-bold" style={{ color: GOLD, backgroundColor: '#FEF9E7' }}>৳{finalBdt.toLocaleString()}</TableCell>
                              <TableCell className="text-xs text-right font-bold">${finalUsd.toLocaleString()}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}