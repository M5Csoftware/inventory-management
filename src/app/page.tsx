import { Package, Truck, Users, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <Package className="h-6 w-6" />
            <span className="text-xl tracking-tight">M5C Logistics <span className="text-muted-foreground text-sm font-normal">Inventory System</span></span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              Export Report
            </Button>
            <Button size="sm">New Shipment</Button>
          </div>
        </header>

        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">14,231</div>
                <p className="text-xs text-muted-foreground">+201 since last week</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">342</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">24</div>
                <p className="text-xs text-muted-foreground">Requires immediate attention</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden transition-all hover:shadow-md bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">99.9%</div>
                <p className="text-xs text-primary/80">All systems operational</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 shadow-sm">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  You have 12 pending approvals today.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">Shipment #{1000 + i}</p>
                        <p className="text-sm text-muted-foreground">
                          Arrived at Warehouse A
                        </p>
                      </div>
                      <div className="ml-auto font-medium text-sm text-muted-foreground">Just now</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3 shadow-sm">
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
                <CardDescription>
                  Inventory distribution by category.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Electronics</span>
                        <span className="text-sm text-muted-foreground">45%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Apparel</span>
                        <span className="text-sm text-muted-foreground">30%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Home & Garden</span>
                        <span className="text-sm text-muted-foreground">15%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
