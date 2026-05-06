import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  useGetCustomerByIdQuery,
  useGetAppointmentsByCustomerQuery,
  useGetNotificationsQuery,
  useGetFinancialReportQuery,
  useGetSalesInvoicesQuery,
  useGetPendingCreditsReportQuery,
  backendApi,
} from '../../services/backendApi'
import { AlertTriangle, Bot, Calendar, CheckCircle2, CreditCard, Info, Receipt } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../../components/ui/dialog'
import { Label } from '../../components/ui/label'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const CustomerHome = () => {
  const user = getStoredUser()
  const customerId = user?.customerId ?? user?.userId
  const userRole = user?.role
  const isStaffOrAdmin = userRole === 'Admin' || userRole === 'Staff'
  const dispatch = useDispatch()
  const [analyzeOpen, setAnalyzeOpen] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({ registrationNumber: '', brand: '', model: '', year: '', odometer: '', notes: '' })
  const [analyzing, setAnalyzing] = useState(false)
  const [insights, setInsights] = useState(null)

  const openAnalyzeDialog = () => {
    // Prefill from customer's first saved vehicle if available
    if (customer?.vehicles?.length > 0) {
      const v = customer.vehicles[0]
      setVehicleForm({
        registrationNumber: v.registrationNumber || '',
        brand: v.brand || '',
        model: v.model || '',
        year: v.year ? String(v.year) : '',
        odometer: '',
        notes: '',
      })
    } else if (customer?.vehicleRegistrationNumbers?.length > 0) {
      setVehicleForm((p) => ({ ...p, registrationNumber: customer.vehicleRegistrationNumbers[0] || '' }))
    }
    setInsights(null)
    setAnalyzeOpen(true)
  }

  const { data: customer } = useGetCustomerByIdQuery(customerId, { skip: !customerId })
  const { data: appointments } = useGetAppointmentsByCustomerQuery(customerId, { skip: !customerId })
  const { data: notifications = [] } = useGetNotificationsQuery()
  const { data: dailyReport } = useGetFinancialReportQuery(
    { period: 'daily' },
    { skip: !customerId || !isStaffOrAdmin },
  )
  const { data: salesInvoices = [] } = useGetSalesInvoicesQuery(undefined, { skip: !customerId })
  const { data: pendingCredits = [] } = useGetPendingCreditsReportQuery(undefined, { skip: !customerId || !isStaffOrAdmin })

  // Filter for AI predictions
  const aiAlerts = notifications.filter((n) => n.type === 'AIPrediction' && !n.isRead)
  const upcomingAppointments = (appointments ?? []).filter((a) => a.status === 'Upcoming' || a.status === 'Pending')

  const recentInvoices = useMemo(() => {
    const customerInvoices = (salesInvoices ?? []).filter((inv) => inv.customerId === customerId)
    return [...customerInvoices]
      .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
      .slice(0, 5)
  }, [salesInvoices, customerId])

  const overdueCustomers = useMemo(() => (pendingCredits ?? []).slice(0, 5), [pendingCredits])

  // handleAnalyzeVehicle removed: analysis now runs via dialog

  // Manual analyze via dialog; remove automatic trigger

  if (!customerId) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500">
            Today's summary · {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openAnalyzeDialog} className="bg-indigo-500 text-white">Analyze now</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Today's sales summary</p>
              <p className="text-2xl font-bold text-slate-900">
                Rs {(dailyReport?.totalSales ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                {dailyReport?.salesInvoiceCount ?? 0} invoices
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Pending appointments</p>
              <p className="text-2xl font-bold text-slate-900">{upcomingAppointments.length}</p>
              <p className="text-xs text-slate-500">Upcoming or awaiting confirmation</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Recent invoices</p>
              <p className="text-2xl font-bold text-slate-900">{recentInvoices.length}</p>
              <p className="text-xs text-slate-500">Latest customer invoices</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Customers with overdue credit</p>
              <p className="text-2xl font-bold text-slate-900">{pendingCredits.length}</p>
              <p className="text-xs text-slate-500">Reported by pending credit list</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Your credit balance</p>
              <p className="text-2xl font-bold text-slate-900">
                Rs {(customer?.creditBalance ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Open balance on your account</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyze dialog */}
      <Dialog open={analyzeOpen} onOpenChange={setAnalyzeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Analyze vehicle</DialogTitle>
            <DialogDescription>Provide vehicle details to run the diagnostic analysis.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-3">
            <div className="space-y-1">
              <Label>Registration number</Label>
              <Input value={vehicleForm.registrationNumber} onChange={(e) => setVehicleForm((p) => ({ ...p, registrationNumber: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Brand</Label>
                <Input value={vehicleForm.brand} onChange={(e) => setVehicleForm((p) => ({ ...p, brand: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Model</Label>
                <Input value={vehicleForm.model} onChange={(e) => setVehicleForm((p) => ({ ...p, model: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Year</Label>
                <Input type="number" value={vehicleForm.year} onChange={(e) => setVehicleForm((p) => ({ ...p, year: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Odometer (km)</Label>
                <Input type="number" value={vehicleForm.odometer} onChange={(e) => setVehicleForm((p) => ({ ...p, odometer: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes / symptoms</Label>
              <Textarea value={vehicleForm.notes} onChange={(e) => setVehicleForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>

            {insights ? (
              <div className="rounded-xl border p-3 bg-slate-50">
                <p className="text-sm font-medium">Insights</p>
                <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{insights}</div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              onClick={async () => {
                try {
                  setAnalyzing(true)
                  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5232/api'
                  const aiBase = import.meta.env.VITE_AI_BASE_URL || apiBase.replace(/\/api\/?$/, '')
                  const token = localStorage.getItem('token')
                  const res = await fetch(`${aiBase}/api/ai/analyze?customerId=${Number(customerId)}`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: token ? `Bearer ${token}` : '',
                    },
                  })
                  if (!res.ok) {
                    const txt = await res.text()
                    throw new Error(txt || `AI service returned ${res.status}`)
                  }
                  const data = await res.json()
                  setInsights(data?.message ?? data?.insights ?? JSON.stringify(data))
                  // Refresh notifications so AI predictions show up
                  dispatch(backendApi.util.invalidateTags(['Notifications']))
                } catch (err) {
                  setInsights(`Error: ${err?.message ?? err}`)
                } finally {
                  setAnalyzing(false)
                }
              }}
              disabled={analyzing}
            >
              {analyzing ? 'Analyzing…' : 'Run analysis'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Loyalty Status */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Loyalty and discounts</CardTitle>
            <CardDescription>
              Customers receive 10% off when a single purchase exceeds Rs 5,000.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-600">
                Total spent
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                Rs {customer?.totalSpent ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-900">
                  {Number(customer?.totalSpent) > 5000 
                    ? "You are eligible for a 10% discount on your next purchase!"
                    : "Spend Rs 5000 in a single purchase to unlock a 10% discount."}
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/customer/part-requests">Request unavailable parts</Link>
            </Button>
          </CardContent>
        </Card>

        {/* AI Vehicle Health Alerts */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-600" />
                AI Vehicle Health Alerts
              </CardTitle>
              <CardDescription>
                Powered by Google Gemini — intelligent predictions based on your service history.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={openAnalyzeDialog}>
              Analyze my vehicle
            </Button>
          </CardHeader>
          <CardContent>
            {aiAlerts.length > 0 ? (
              <div className="space-y-3">
                {aiAlerts.map((alert) => (
                  <div key={alert.notificationId} className="flex gap-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{alert.title}</h4>
                      <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
                <Info className="mb-2 h-8 w-8 text-slate-400" />
                <p className="font-medium text-slate-900">No alerts right now</p>
                <p className="text-sm text-slate-500">Your vehicles appear to be in good health.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent invoices</CardTitle>
              <CardDescription>Your most recent invoices</CardDescription>
            </div>
            <Badge variant="outline" className="border-indigo-200 text-indigo-600">
              {recentInvoices.length} records
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((inv) => (
                  <TableRow key={inv.salesInvoiceId}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{inv.invoiceNumber}</div>
                      <p className="text-xs text-slate-500">{inv.status}</p>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">
                      Rs {Number(inv.totalAmount ?? 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {recentInvoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-slate-400">
                      No invoices available yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Customers with overdue credit</CardTitle>
              <CardDescription>Outstanding balances that need attention</CardDescription>
            </div>
            <Badge variant="outline" className="border-amber-200 text-amber-600">
              {pendingCredits.length} customers
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Pending credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueCustomers.map((cust) => (
                  <TableRow key={cust.customerId}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{cust.fullName}</div>
                      <p className="text-xs text-slate-500">{cust.phoneNumber}</p>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">
                      Rs {Number(cust.pendingCredit ?? 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {overdueCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-sm text-slate-400">
                      No overdue credit records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Your next scheduled service visits.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((app) => (
                <div key={app.appointmentId} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-200 hover:shadow-md">
                  <div>
                    <Badge variant={app.status === 'Upcoming' ? 'default' : 'secondary'} className="mb-3">
                      {app.status}
                    </Badge>
                    <h3 className="font-semibold text-slate-900">{app.serviceType}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(app.appointmentDateTime).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {app.description && (
                    <p className="mt-4 text-xs text-slate-400 line-clamp-2">
                      Notes: {app.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 md:col-span-2 lg:col-span-3">You have no upcoming appointments.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerHome
