'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInventory, AssetAssignment } from '@/context/inventory-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Laptop, Undo2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAutoAnimate } from '@formkit/auto-animate/react';

export default function AssetsPage() {
  const { assets, returnAsset } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [animationParent] = useAutoAnimate();

  const filteredAssets = assets.filter((asset) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      asset.productName.toLowerCase().includes(searchLower) ||
      asset.assignedTo.toLowerCase().includes(searchLower) ||
      asset.id.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">Assets (Assigned)</h1>
          <p className="text-muted-foreground mt-1">Track items assigned to staff and locations.</p>
        </div>
        <Link href="/stock/assets/new">
          <Button className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
            <PlusCircle className="mr-2 h-4 w-4" /> Assign Asset
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-xl">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Laptop className="h-5 w-5 text-primary" />
              Asset Registry
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search assets..."
                className="pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Assigned To</th>
                  <th className="px-6 py-4 font-medium">Assigned Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody ref={animationParent} className="divide-y divide-border/50">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Laptop className="h-8 w-8 text-muted-foreground/40" />
                        <p>No assets found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{asset.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{asset.productName}</span>
                          <span className="text-xs text-muted-foreground">{asset.quantity} Unit(s)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {asset.assignedTo.charAt(0).toUpperCase()}
                          </div>
                          {asset.assignedTo}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(asset.assignedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        {asset.status === 'Assigned' ? (
                          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                            Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Returned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {asset.status === 'Assigned' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-950 dark:hover:border-emerald-800"
                            onClick={() => returnAsset(asset.id)}
                          >
                            <Undo2 className="mr-2 h-3.5 w-3.5" /> Return Asset
                          </Button>
                        )}
                        {asset.status === 'Returned' && (
                          <span className="text-xs text-muted-foreground">
                            {asset.returnedDate ? new Date(asset.returnedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
