import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Calendar,
  CreditCard,
  FileText,
  TrendingUp,
  Clock,
  Plus,
  Users,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import {
  useGetAppointmentsQuery,
  useGetSalesInvoicesQuery,
  useGetPendingCreditsReportQuery,
} from '../../services/backendApi'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const StaffDashboard = () => {
  const { data: appointments = [] } = useGetAppointmentsQuery()
  const { data: salesInvoices = [] } = useGetSalesInvoicesQuery()
  const { data: credits = [] } = useGetPendingCreditsReportQuery(30)

  const today = new Date().toISOString().split('T')[0]

  const todaysSales = useMemo(
    () => salesInvoices.filter((inv) => inv.invoiceDate?.startsWith(today)),
    [salesInvoices, today],
  )
  const todaysSalesValue = todaysSales.reduce((a, inv) => a + inv.totalAmount, 0)

  const recentInvoices = useMemo(
    () =>
      [...salesInvoices]
        .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
        .slice(0, 5),
    [salesInvoices],
  )

  const pendingAppointments = useMemo(
    () => appointments.filter((a) => a.status === 'Pending'),
    [appointments],
  )

  const salesTrend = useMemo(() => {
    const now = new Date()
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(now.getDate() - (6 - i))
      const key = d.toISOString().split('T')[0]
      return { key, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), total: 0 }
    })
    const map = new Map(days.map((d) => [d.key, d]))
    salesInvoices.forEach((inv) => {
      const b = map.get(inv.invoiceDate?.split('T')[0])
      if (b) b.total += Number(inv.totalAmount ?? 0)
    })
    return days.map((d) => ({ label: d.label, total: d.total }))
  }, [salesInvoices])

  const statusBreakdown = useMemo(() => {
    const counts = appointments.reduce((acc, a) => {
      const k = a.status || 'Unknown'
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [appointments])

  const overdueChart = useMemo(
    () =>
      [...credits]
        .sort((a, b) => Number(b.pendingCredit ?? 0) - Number(a.pendingCredit ?? 0))
        .slice(0, 5)
        .map((c) => ({ name: c.fullName?.split(' ')[0] ?? 'N/A', amount: Number(c.pendingCredit ?? 0) })),
    [credits],
  )

  const greeting =
    new Date().getHours() < 12
      ? 'Good morning'
      : new Date().getHours() < 18
        ? 'Good afternoon'
        : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Simple greeting bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Clock className="h-3.5 w-3.5" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{greeting} 👋</h2>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/staff/customers">
              <Users className="h-3.5 w-3.5" /> New Customer
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 bg-gray-900 hover:bg-gray-700 text-white">
            <Link to="/staff/sales-invoices">
              <Plus className="h-3.5 w-3.5" /> New Sale
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Today's Sales",
            value: `Rs ${todaysSalesValue.toLocaleString()}`,

            sub: `${todaysSales.length} invoice${todaysSales.length !== 1 ? 's' : ''}`,
            icon: FileText,
          },
          {
            label: 'Pending Appointments',
            value: pendingAppointments.length,
            sub: 'awaiting action',
            icon: Calendar,
          },
          {
            label: 'Overdue Credit',
            value: credits.length,
            sub: 'customers',
            icon: CreditCard,
          },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
              <Icon className="h-4 w-4 text-gray-300" />
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Sales trend */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Sales Trend</p>
              <p className="text-xs text-gray-400">Last 7 days</p>
            </div>
            <TrendingUp className="h-4 w-4 text-gray-300" />
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#111827" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#111827" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={8} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb', boxShadow: 'none', fontSize: '12px' }}
                  formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="total" stroke="#111827" strokeWidth={1.5} fill="url(#sf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overdue credit */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Overdue Credit</p>
              <p className="text-xs text-gray-400">Top 5 by balance</p>
            </div>
            <AlertTriangle className="h-4 w-4 text-gray-300" />
          </div>
          {overdueChart.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overdueChart} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb', boxShadow: 'none', fontSize: '12px' }}
                    formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, 'Pending']}
                  />
                  <Bar dataKey="amount" fill="#111827" radius={[0, 3, 3, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-sm text-gray-400">No overdue credits</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent invoices */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Recent Invoices</p>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-gray-400 hover:text-gray-700 gap-1">
              <Link to="/staff/sales-invoices">View all <ArrowUpRight className="h-3 w-3" /></Link>
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="text-xs text-gray-400 font-medium">Invoice</TableHead>
                <TableHead className="text-xs text-gray-400 font-medium">Customer</TableHead>
                <TableHead className="text-right text-xs text-gray-400 font-medium">Total</TableHead>
                <TableHead className="text-right text-xs text-gray-400 font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentInvoices.map((inv) => (
                <TableRow key={inv.salesInvoiceId} className="hover:bg-gray-50/60">
                  <TableCell>
                    <p className="font-medium text-gray-900 text-sm">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-400">{new Date(inv.invoiceDate).toLocaleDateString()}</p>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{inv.customerName}</TableCell>
                  <TableCell className="text-right font-medium text-gray-900 text-sm">
                    Rs {inv.totalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={`text-xs font-normal ${inv.status === 'Paid' ? 'border-green-200 text-green-700 bg-green-50' : 'border-gray-200 text-gray-500 bg-gray-50'}`}
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {recentInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-gray-400">
                    No invoices yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Appointment status */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Appointments</p>
              <p className="text-xs text-gray-400">By status</p>
            </div>
            <Calendar className="h-4 w-4 text-gray-300" />
          </div>
          {statusBreakdown.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBreakdown} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb', boxShadow: 'none', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="#d1d5db" radius={[3, 3, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-sm text-gray-400">No appointments</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard
