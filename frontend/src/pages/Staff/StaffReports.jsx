import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

import { Button } from '../../components/ui/button'
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
  useGetHighSpendersReportQuery,
  useGetPendingCreditsReportQuery,
  useGetRegularCustomersReportQuery,
} from '../../services/backendApi'

const downloadCSV = (filename, rows) => {
  if (!rows || !rows.length) return
  const keys = Object.keys(rows[0])
  const header = keys.join(',')
  const csv = [header]
  for (const row of rows) {
    const line = keys.map((k) => {
      const v = row[k] ?? ''
      // escape quotes
      const s = typeof v === 'number' ? v : String(v).replace(/"/g, '""')
      return `"${s}"`
    }).join(',')
    csv.push(line)
  }
  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const tabs = ['Regular Customers', 'Top Spenders', 'Pending Credits']

const StaffReports = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [minPurchases, setMinPurchases] = useState('3')
  const [minSpent, setMinSpent] = useState('5000')
  const [overdueDays, setOverdueDays] = useState('30')

  const { data: regulars = [], refetch: refetchRegulars, isFetching: fetchingRegulars } =
    useGetRegularCustomersReportQuery(Number(minPurchases))
  const { data: spenders = [], refetch: refetchSpenders, isFetching: fetchingSpenders } =
    useGetHighSpendersReportQuery(Number(minSpent))
  const { data: credits = [], refetch: refetchCredits, isFetching: fetchingCredits } =
    useGetPendingCreditsReportQuery(Number(overdueDays))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customer Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Loyalty trends, spending patterns, and overdue credits</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-sm"
          onClick={() => { refetchRegulars(); refetchSpenders(); refetchCredits() }}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(i)}
              className={[
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === i
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-700',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 0 – Regular Customers */}
      {activeTab === 0 && (
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Min. purchases</Label>
              <Input
                type="number"
                value={minPurchases}
                onChange={(e) => setMinPurchases(e.target.value)}
                className="w-32"
              />
            </div>
            <Button variant="outline" size="sm" onClick={refetchRegulars} disabled={fetchingRegulars}>
              Apply
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadCSV('regular-customers.csv', regulars)} disabled={!regulars.length}>
              Export CSV
            </Button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide">#</TableHead>
                  <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide">Name</TableHead>
                  <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide">Phone</TableHead>
                  <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide text-right">Purchases</TableHead>
                  <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide text-right">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regulars.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-sm text-gray-400">No regular customers found.</TableCell>
                  </TableRow>
                ) : regulars.map((r, i) => (
                  <TableRow key={r.customerId} className="hover:bg-gray-50/60">
                    <TableCell className="text-gray-400 text-sm">{i + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{r.fullName}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{r.phoneNumber}</TableCell>
                    <TableCell className="text-right text-gray-700">{r.purchaseCount}</TableCell>
                    <TableCell className="text-right font-medium text-gray-900">Rs {Number(r.totalSpent).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tab 1 – Top Spenders */}
      {activeTab === 1 && (
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Min. spend (Rs)</Label>
              <Input
                type="number"
                value={minSpent}
                onChange={(e) => setMinSpent(e.target.value)}
                className="w-40"
              />
            </div>
            <Button variant="outline" size="sm" onClick={refetchSpenders} disabled={fetchingSpenders}>
              Apply
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadCSV('top-spenders.csv', spenders)} disabled={!spenders.length}>
              Export CSV
            </Button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide">#</TableHead>
                  <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide">Name</TableHead>
                  <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide">Phone</TableHead>
                  <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide text-right">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spenders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-sm text-gray-400">No high spenders found.</TableCell>
                  </TableRow>
                ) : spenders.map((s, i) => (
                  <TableRow key={s.customerId} className="hover:bg-gray-50/60">
                    <TableCell className="text-gray-400 text-sm">{i + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{s.fullName}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{s.phoneNumber}</TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">Rs {Number(s.totalSpent).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tab 2 – Pending Credits */}
      {activeTab === 2 && (
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Overdue days (&gt;)</Label>
              <Input
                type="number"
                value={overdueDays}
                onChange={(e) => setOverdueDays(e.target.value)}
                className="w-32"
              />
            </div>
            <Button variant="outline" size="sm" onClick={refetchCredits} disabled={fetchingCredits}>
              Apply
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadCSV('pending-credits.csv', credits)} disabled={!credits.length}>
              Export CSV
            </Button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide">#</TableHead>
                  <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide">Name</TableHead>
                  <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide">Phone</TableHead>
                  <TableHead className="text-xs uppercase text-gray-400 font-medium tracking-wide text-right">Pending Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-sm text-gray-400">No overdue credits found.</TableCell>
                  </TableRow>
                ) : credits.map((c, i) => (
                  <TableRow key={c.customerId} className="hover:bg-gray-50/60">
                    <TableCell className="text-gray-400 text-sm">{i + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{c.fullName}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{c.phoneNumber}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">Rs {Number(c.pendingCredit).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffReports
