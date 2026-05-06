import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { DownloadCloud } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'react-toastify'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  useGetFinancialReportQuery,
  useGetPartsQuery,
  useGetPurchaseInvoicesQuery,
  useGetSalesInvoicesQuery,
} from '../../services/backendApi'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const rs = (val) => `Rs ${Number(val || 0).toLocaleString()}`

const AdminReports = () => {
  const [period, setPeriod] = useState('monthly')
  const [date, setDate] = useState('')

  const queryArgs = useMemo(
    () => ({ period, date: date ? `${date}T00:00:00` : undefined }),
    [period, date],
  )

  const { data: report, isFetching, isError } = useGetFinancialReportQuery(queryArgs)
  const { data: parts = [] } = useGetPartsQuery()
  const { data: purchaseInvoices = [] } = useGetPurchaseInvoicesQuery()
  const { data: salesInvoices = [] } = useGetSalesInvoicesQuery()

  // Financial summary cards
  const summary = report
    ? [
        { label: 'Total Sales', value: rs(report.totalSales), color: 'text-emerald-700 bg-emerald-50' },
        { label: 'Total Purchases', value: rs(report.totalPurchases), color: 'text-cyan-700 bg-cyan-50' },
        { label: 'Gross Profit', value: rs(report.grossProfit), color: 'text-violet-700 bg-violet-50' },
        { label: 'Sales Invoices', value: report.salesInvoiceCount, color: 'text-cyan-700 bg-cyan-50' },
        { label: 'Purchase Invoices', value: report.purchaseInvoiceCount, color: 'text-amber-700 bg-amber-50' },
      ]
    : []

  // Inventory report data
  const inventoryData = useMemo(() => {
    const purchaseMap = new Map()
    purchaseInvoices.forEach(inv => inv.items?.forEach(item => purchaseMap.set(item.partId, (purchaseMap.get(item.partId) || 0) + item.quantity)))
    const soldMap = new Map()
    salesInvoices.forEach(inv => inv.items?.forEach(item => soldMap.set(item.partId, (soldMap.get(item.partId) || 0) + item.quantity)))
    return parts.map((p) => {
      const purchased = purchaseMap.get(p.partId) || 0
      const sold = soldMap.get(p.partId) || 0
      const remaining = Math.max(purchased - sold, 0)
      return {
        name: p.partName?.length > 15 ? p.partName.substring(0, 15) + '...' : p.partName,
        stock: remaining,
        reorder: p.reorderLevel,
      }
    }).slice(0, 10)
  }, [parts, purchaseInvoices, salesInvoices])

  // Pie chart: stock distribution
  const stockPie = useMemo(() => {
    const purchaseMap = new Map()
    purchaseInvoices.forEach(inv => inv.items?.forEach(item => purchaseMap.set(item.partId, (purchaseMap.get(item.partId) || 0) + item.quantity)))
    const soldMap = new Map()
    salesInvoices.forEach(inv => inv.items?.forEach(item => soldMap.set(item.partId, (soldMap.get(item.partId) || 0) + item.quantity)))
    const inStock = parts.filter((p) => (Math.max((purchaseMap.get(p.partId) || 0) - (soldMap.get(p.partId) || 0), 0)) > p.reorderLevel).length
    const lowStock = parts.filter((p) => {
      const remaining = Math.max((purchaseMap.get(p.partId) || 0) - (soldMap.get(p.partId) || 0), 0)
      return remaining <= p.reorderLevel && remaining > 0
    }).length
    const outOfStock = parts.filter((p) => Math.max((purchaseMap.get(p.partId) || 0) - (soldMap.get(p.partId) || 0), 0) === 0).length
    return [
      { name: 'In Stock', value: inStock },
      { name: 'Low Stock', value: lowStock },
      { name: 'Out of Stock', value: outOfStock },
    ].filter((d) => d.value > 0)
  }, [parts, purchaseInvoices, salesInvoices])

  // Revenue vs Purchases trend (using bar chart with report data)
  const financialChart = report
    ? [
        { name: 'Sales', amount: report.totalSales },
        { name: 'Purchases', amount: report.totalPurchases },
        { name: 'Profit', amount: report.grossProfit },
      ]
    : []

  // CSV export
  const handleExportCSV = () => {
    try {
      if (!report) return
      const rows = [
        ['Metric', 'Value'],
        ['Period', report.period],
        ['Start Date', new Date(report.startDate).toLocaleDateString()],
        ['End Date', new Date(report.endDate).toLocaleDateString()],
        ['Total Sales', report.totalSales],
        ['Total Purchases', report.totalPurchases],
        ['Gross Profit', report.grossProfit],
        ['Sales Invoice Count', report.salesInvoiceCount],
        ['Purchase Invoice Count', report.purchaseInvoiceCount],
      ]
      
      const escapeCsv = (val) => {
        if (val === null || val === undefined) return '""'
        const str = String(val)
        return `"${str.replace(/"/g, '""')}"`
      }
      
      const csvContent = rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
      // Add BOM to ensure Excel opens UTF-8 properly
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financial_report_${period}_${new Date().toISOString().split('T')[0]}.csv`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    } catch (err) {
      console.error("CSV Export Error:", err)
      toast.error("Failed to export CSV. Please try again.")
    }
  }

  // PDF export (using jsPDF)
  const handleExportPDF = () => {
    try {
      if (!report) return
      const doc = new jsPDF()

      doc.setFontSize(20)
      doc.text('Financial Report', 14, 22)

      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Period: ${report.period.toUpperCase()}`, 14, 30)
      doc.text(`Date Range: ${new Date(report.startDate).toLocaleDateString()} to ${new Date(report.endDate).toLocaleDateString()}`, 14, 35)

      const tableColumn = ["Metric", "Value"]
      const tableRows = [
        ["Total Sales", `Rs ${report.totalSales.toFixed(2)}`],
        ["Total Purchases", `Rs ${report.totalPurchases.toFixed(2)}`],
        ["Gross Profit", `Rs ${report.grossProfit.toFixed(2)}`],
        ["Sales Invoice Count", report.salesInvoiceCount],
        ["Purchase Invoice Count", report.purchaseInvoiceCount],
      ]

      autoTable(doc, {
        startY: 45,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      })

      const finalY = doc.lastAutoTable?.finalY || 45

      if (inventoryData.length > 0) {
        doc.setFontSize(14)
        doc.setTextColor(0)
        doc.text('Inventory Status (Top Parts)', 14, finalY + 15)

        const invTableColumn = ["Part Name", "Current Stock", "Reorder Level"]
        const invTableRows = inventoryData.map(p => [
          p.name,
          p.stock,
          p.reorder
        ])

        autoTable(doc, {
          startY: finalY + 20,
          head: [invTableColumn],
          body: invTableRows,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] }
        })
      }

      doc.save(`financial_report_${period}_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error("PDF Export Error:", err)
      toast.error("Failed to export PDF.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financial Reports</h2>
          <p className="text-sm text-slate-500">
            Generate daily, monthly, or yearly insights across sales and purchases.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCSV}
            disabled={!report}
            className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
          >
            <DownloadCloud className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportPDF}
            className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
          >
            <DownloadCloud className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card className="rounded-none shadow-sm">
        <CardContent className="py-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="report-period">Time Period</Label>
              <select
                id="report-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="flex h-9 w-full rounded-none border border-input bg-background px-3 text-sm transition-colors focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
              >
                <option value="daily">Today (Daily)</option>
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
                <option value="yearly">This Year</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-date">Reference Date</Label>
              <div className="flex w-full">
                <Input
                  id="report-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 rounded-none flex-1 border-r-0"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-9 rounded-none px-4 text-xs hover:bg-red-50 hover:text-red-600"
                  onClick={() => setDate('')}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isError && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-destructive">
              Unable to load the report. Please check the connection.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardContent className="py-5">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                {item.label}
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900">{item.value}</p>
              <Badge variant="outline" className="mt-2">
                {period}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Financial Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Sales vs Purchases vs Profit ({period})</CardDescription>
          </CardHeader>
          <CardContent>
            {financialChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={financialChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v) => rs(v)}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {financialChart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-10">
                {isFetching ? 'Loading...' : 'No data available.'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stock Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Distribution</CardTitle>
            <CardDescription>Inventory health overview</CardDescription>
          </CardHeader>
          <CardContent>
            {stockPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stockPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {stockPie.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-10">
                No parts data available.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Report */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Report</CardTitle>
          <CardDescription>Stock levels vs Reorder levels (top 10 parts)</CardDescription>
        </CardHeader>
        <CardContent>
          {inventoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="stock" fill="#3b82f6" name="Current Stock" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reorder" fill="#f59e0b" name="Reorder Level" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-10">No parts data.</p>
          )}
        </CardContent>
      </Card>

      {/* Report Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          <CardDescription>
            {report
              ? `Period: ${report.period} | ${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`
              : 'Select a period to load the report.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Total Sales</TableCell>
                <TableCell className="text-right font-medium">{report ? rs(report.totalSales) : '--'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Purchases</TableCell>
                <TableCell className="text-right font-medium">{report ? rs(report.totalPurchases) : '--'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Gross Profit</TableCell>
                <TableCell className="text-right font-medium">{report ? rs(report.grossProfit) : '--'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Sales Invoices</TableCell>
                <TableCell className="text-right">{report?.salesInvoiceCount ?? '--'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Purchase Invoices</TableCell>
                <TableCell className="text-right">{report?.purchaseInvoiceCount ?? '--'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          {isFetching && (
            <p className="p-4 text-sm text-slate-500">Refreshing report...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminReports
