import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

import StaffPageHeader from '../../components/staff/StaffPageHeader'
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
import { useGetPendingCreditsReportQuery } from '../../services/backendApi'

const StaffCreditTracking = () => {
  const [overdueDays, setOverdueDays] = useState('30')

  const {
    data: credits = [],
    refetch,
    isFetching,
  } = useGetPendingCreditsReportQuery(Number(overdueDays))

  return (
    <div className="space-y-5">
      <StaffPageHeader
        title="Credit tracking"
        subtitle="Monitor overdue balances and follow up with customers."
        action={(
          <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        )}
      />

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
        <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching}>
          Apply
        </Button>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs uppercase text-slate-400 font-medium tracking-wide">#</TableHead>
              <TableHead className="text-xs uppercase text-slate-400 font-medium tracking-wide">Name</TableHead>
              <TableHead className="text-xs uppercase text-slate-400 font-medium tracking-wide">Phone</TableHead>
              <TableHead className="text-xs uppercase text-slate-400 font-medium tracking-wide text-right">Pending Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-sm text-slate-400">
                  No overdue credits found.
                </TableCell>
              </TableRow>
            ) : credits.map((c, i) => (
              <TableRow key={c.customerId} className="hover:bg-slate-50/60">
                <TableCell className="text-slate-400 text-sm">{i + 1}</TableCell>
                <TableCell className="font-medium text-slate-900">{c.fullName}</TableCell>
                <TableCell className="text-slate-500 text-sm">{c.phoneNumber}</TableCell>
                <TableCell className="text-right font-semibold text-emerald-700">Rs {Number(c.pendingCredit ?? 0).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default StaffCreditTracking
