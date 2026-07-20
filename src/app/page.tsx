import { Package, Truck, Users, Activity, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, Search, Bell, Settings, LayoutDashboard, Box, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"></div>
      
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-col border-r bg-background/50 backdrop-blur-xl md:flex">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">M5C Logistics</span>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            <a href="#" className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary transition-all hover:bg-primary/20">
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-sm font-medium">Dashboard</span>
            </a>
            <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
              <Box className="h-4 w-4" />
              <span className="text-sm font-medium">Inventory</span>
            </a>
            <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
              <Truck className="h-4 w-4" />
              <span className="text-sm font-medium">Shipments</span>
            </a>
            <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Suppliers</span>
            </a>
            <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Reports</span>
            </a>
          </nav>
          <div className="p-4 border-t">
            <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Settings</span>
            </a>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/50 backdrop-blur-xl px-6">
            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search inventory..."
                  className="h-9 w-64 rounded-md border border-input bg-background/50 pl-9 pr-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]"></span>
              </Button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 ring-2 ring-background border border-border"></div>
            </div>
          </header>

          <div className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                <p className="text-muted-foreground mt-1">Here is the latest data for your inventory.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="hidden sm:flex bg-background/50 backdrop-blur-sm border-dashed">
                  Download CSV
                </Button>
                <Button className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
                  <Package className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="group relative overflow-hidden bg-background/60 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
                  <div className="p-2 rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Package className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">14,231</div>
                  <div className="flex items-center mt-1 text-xs font-medium text-emerald-500">
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    +2.5% <span className="text-muted-foreground font-normal ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-background/60 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Shipments</CardTitle>
                  <div className="p-2 rounded-md bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                    <Truck className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">342</div>
                  <div className="flex items-center mt-1 text-xs font-medium text-emerald-500">
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    +12% <span className="text-muted-foreground font-normal ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-background/60 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:shadow-md hover:border-destructive/30">
                <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
                  <div className="p-2 rounded-md bg-destructive/10 text-destructive ring-1 ring-destructive/20 relative">
                    <AlertCircle className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive animate-pulse"></span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight text-destructive">24</div>
                  <div className="flex items-center mt-1 text-xs font-medium text-destructive">
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                    Requires attention
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-md transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-primary">System Health</CardTitle>
                  <div className="p-2 rounded-md bg-primary/20 text-primary">
                    <Activity className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight text-primary">99.9%</div>
                  <div className="flex items-center mt-1 text-xs font-medium text-primary/80">
                    All systems operational
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 bg-background/60 backdrop-blur-sm shadow-sm border-border/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Recent Activity</CardTitle>
                      <CardDescription>Latest movements in your inventory.</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      { id: '1024', event: 'Shipment dispatched', loc: 'Warehouse A', time: '10 mins ago', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                      { id: '1025', event: 'Low stock alert', loc: 'Gaming Monitors', time: '1 hour ago', icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
                      { id: '1026', event: 'Inventory updated', loc: 'Headphones', time: '2 hours ago', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                      { id: '1027', event: 'New supplier added', loc: 'Tech Solutions Inc.', time: '5 hours ago', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center group cursor-pointer">
                        <div className={`p-2 rounded-full ${item.bg} ${item.color} mr-4 ring-1 ring-inset ring-current/20 group-hover:scale-110 transition-transform`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{item.event}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.loc} <span className="mx-1">•</span> #{item.id}
                          </p>
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">{item.time}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-3 bg-background/60 backdrop-blur-sm shadow-sm border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Top Categories</CardTitle>
                  <CardDescription>Inventory distribution by category.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      { name: 'Electronics', percent: 45, color: 'bg-primary' },
                      { name: 'Apparel', percent: 30, color: 'bg-blue-500' },
                      { name: 'Home & Garden', percent: 15, color: 'bg-emerald-500' },
                      { name: 'Automotive', percent: 10, color: 'bg-amber-500' },
                    ].map((cat, i) => (
                      <div key={i} className="group">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">{cat.name}</span>
                          <span className="text-sm text-muted-foreground font-mono">{cat.percent}%</span>
                        </div>
                        <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden ring-1 ring-inset ring-border/50">
                          <div className={`${cat.color} h-2.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${cat.percent}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Generate Report</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Get detailed category breakdown</p>
                    </div>
                    <Button variant="secondary" size="sm" className="shadow-sm">Create</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
