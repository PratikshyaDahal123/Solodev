import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  DollarSign,
  Package,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  ArrowUpRight,
  Activity,
  Calendar,
  Clock,
  Plus,
} from 'lucide-react'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  useGetPartsQuery,
  useGetFinancialReportQuery,
  useGetPurchaseInvoicesQuery,
  useGetSalesInvoicesQuery,
} from '../../services/backendApi'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const AdminDashboard = () => {
  const { data: parts = [] } = useGetPartsQuery()
  const { data: dailyReport } = useGetFinancialReportQuery({ period: 'daily' })
  const { data: purchaseInvoices = [] } = useGetPurchaseInvoicesQuery()
  const { data: salesInvoices = [] } = useGetSalesInvoicesQuery()

  const todayRevenue = dailyReport?.totalSales ?? 0
  const todayPurchases = dailyReport?.totalPurchases ?? 0
  const partsSoldToday = dailyReport?.salesInvoiceCount ?? 0

  const lowStockParts = useMemo(
    () => {
      const purchaseMap = new Map()
      purchaseInvoices.forEach(inv => inv.items?.forEach(item => purchaseMap.set(item.partId, (purchaseMap.get(item.partId) || 0) + item.quantity)))
      const soldMap = new Map()
      salesInvoices.forEach(inv => inv.items?.forEach(item => soldMap.set(item.partId, (soldMap.get(item.partId) || 0) + item.quantity)))
      return parts.filter((p) => {
        const purchased = purchaseMap.get(p.partId) || 0
        const sold = soldMap.get(p.partId) || 0
        const remaining = Math.max(purchased - sold, 0)
        return remaining <= p.reorderLevel && p.isActive
      })
    },
    [parts, purchaseInvoices, salesInvoices],
  )

  // 7-Day Trend
  const last7Days = useMemo(() => {
    const dates = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    }
    return dates.map(date => {
      const salesOnDate = salesInvoices.filter(s => new Date(s.invoiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === date).reduce((acc, s) => acc + s.totalAmount, 0)
      const purchasesOnDate = purchaseInvoices.filter(p => new Date(p.invoiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === date).reduce((acc, p) => acc + p.totalAmount, 0)
      return { date, Sales: salesOnDate, Purchases: purchasesOnDate }
    })
  }, [salesInvoices, purchaseInvoices])

  // Top Selling Parts
  const topSellingParts = useMemo(() => {
    const partSales = {}
    ;(salesInvoices || []).forEach((inv) => {
      ;(inv.items || []).forEach((item) => {
        partSales[item.partId] = (partSales[item.partId] || 0) + item.quantity
      })
    })
    return Object.entries(partSales)
      .map(([partId, qty]) => {
        const part = parts.find((p) => p.partId === Number(partId))
        return { name: part?.partName?.substring(0, 15) ?? `Part #${partId}`, qty }
      })
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [salesInvoices, parts])

  // Stock Health
  const stockHealth = useMemo(() => {
    let outOfStock = 0
    let lowStock = 0
    let healthy = 0
    const purchaseMap = new Map()
    purchaseInvoices.forEach(inv => inv.items?.forEach(item => purchaseMap.set(item.partId, (purchaseMap.get(item.partId) || 0) + item.quantity)))
    const soldMap = new Map()
    salesInvoices.forEach(inv => inv.items?.forEach(item => soldMap.set(item.partId, (soldMap.get(item.partId) || 0) + item.quantity)))
    parts.forEach(p => {
      const purchased = purchaseMap.get(p.partId) || 0
      const sold = soldMap.get(p.partId) || 0
      const remaining = Math.max(purchased - sold, 0)
      if (remaining === 0) outOfStock++
      else if (remaining <= p.reorderLevel) lowStock++
      else healthy++
    })
    return [
      { name: 'Healthy', value: healthy, fill: '#10b981' },
      { name: 'Low Stock', value: lowStock, fill: '#f59e0b' },
      { name: 'Out of Stock', value: outOfStock, fill: '#ef4444' },
    ].filter(d => d.value > 0)
  }, [parts, purchaseInvoices, salesInvoices])

  // Recent Transactions
  const recentTransactions = useMemo(() => {
    const s = salesInvoices.map(inv => ({ id: inv.invoiceNumber, type: 'Sale', date: new Date(inv.invoiceDate), amount: inv.totalAmount }))
    const p = purchaseInvoices.map(inv => ({ id: inv.invoiceNumber, type: 'Purchase', date: new Date(inv.invoiceDate), amount: inv.totalAmount }))
    return [...s, ...p].sort((a, b) => b.date - a.date).slice(0, 6)
  }, [salesInvoices, purchaseInvoices])

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

  const statCards = [
    {
      label: 'Revenue Today',
      value: `Rs ${todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      shadow: 'shadow-emerald-500/20',
    },
    {
      label: 'Purchases Today',
      value: `Rs ${todayPurchases.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-cyan-500',
      shadow: 'shadow-blue-500/20',
    },
    {
      label: 'Sales Invoices Today',
      value: partsSoldToday,
      icon: ShoppingCart,
      color: 'bg-violet-500',
      shadow: 'shadow-violet-500/20',
    },
    {
      label: 'Low Stock Alerts',
      value: lowStockParts.length,
      icon: AlertTriangle,
      color: 'bg-amber-500',
      shadow: 'shadow-amber-500/20',
    },
  ]

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-cyan-200">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">{greeting}, Admin!</h2>
          <p className="text-slate-300 max-w-xl leading-relaxed">
            Here's what's happening with your inventory and financials today. Check alerts and review your 7-day performance.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md">
            <Link to="/admin/reports">
              <BarChart3 className="h-4 w-4 mr-2" />
              Full Reports
            </Link>
          </Button>
          <Button asChild className="bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/30 border-0">
            <Link to="/admin/sales-invoices">
              <Plus className="h-4 w-4 mr-2" />
              New Sale
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className={`border-0 shadow-lg ${stat.shadow} overflow-hidden group`}>
            <CardContent className="p-6 relative">
              <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${stat.color}`} />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 7-Day Trend */}
        <Card className="lg:col-span-2 border-slate-200/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-500" />
              7-Day Performance Trend
            </CardTitle>
            <CardDescription>Daily comparison of sales revenue vs purchase costs.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => `Rs ${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`Rs ${value.toLocaleString()}`, undefined]}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="Purchases" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorPurchases)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stock Health */}
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-violet-500" />
              Inventory Health
            </CardTitle>
            <CardDescription>Current stock level distribution.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[240px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockHealth}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {stockHealth.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-900">{parts.length}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Parts</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {stockHealth.map((item) => (
                <div key={item.name} className="flex flex-col items-center p-2 rounded-xl bg-slate-50">
                  <div className="h-3 w-3 rounded-full mb-2 shadow-sm" style={{ backgroundColor: item.fill }} />
                  <span className="text-xl font-bold text-slate-800">{item.value}</span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Parts Chart */}
        <Card className="border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg">Top Selling Parts</CardTitle>
            <CardDescription>Most sold items by quantity across all time.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            {topSellingParts.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topSellingParts} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="qty" fill="url(#barGradient)" radius={[0, 6, 6, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center flex-col gap-3 text-slate-400">
                <Package className="h-8 w-8 opacity-20" />
                <p className="text-sm">No sales data available yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <CardDescription>Latest sales and purchases.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="h-8 rounded-full px-4 border-slate-200">
              <Link to="/admin/sales-invoices">
                View All <ArrowUpRight className="h-3 w-3 ml-1 opacity-50" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <Table>
              <TableHeader className="bg-transparent">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-500">Transaction ID</TableHead>
                  <TableHead className="font-semibold text-slate-500">Type</TableHead>
                  <TableHead className="font-semibold text-slate-500">Date</TableHead>
                  <TableHead className="text-right font-semibold text-slate-500">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx, idx) => (
                  <TableRow key={`${tx.id}-${idx}`} className="group hover:bg-slate-50/50">
                    <TableCell className="font-bold text-slate-700">
                      {tx.id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={tx.type === 'Sale' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-cyan-600 border-cyan-200 bg-cyan-50'}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {tx.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${tx.type === 'Sale' ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {tx.type === 'Sale' ? '+' : '-'}Rs {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
                {recentTransactions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-12 text-center text-sm text-slate-400"
                    >
                      <Calendar className="h-8 w-8 opacity-20 mx-auto mb-3" />
                      No recent transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard
