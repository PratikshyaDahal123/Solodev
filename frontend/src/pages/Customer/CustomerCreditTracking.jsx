import { useMemo } from 'react'

import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { useGetCustomerByIdQuery, useGetSalesInvoicesQuery } from '../../services/backendApi'

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const money = (value) => `Rs ${Number(value ?? 0).toLocaleString()}`

const CustomerCreditTracking = () => {
  const user = getStoredUser()
  const customerId = user?.customerId ?? user?.userId

  const { data: customer } = useGetCustomerByIdQuery(customerId, { skip: !customerId })
  const { data: invoices = [] } = useGetSalesInvoicesQuery(undefined, { skip: !customerId })

  const myInvoices = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.customerId === customerId)
        .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate)),
    [invoices, customerId],
  )

  const summary = useMemo(() => {
    const totalAmount = myInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0)
    const amountPaid = myInvoices.reduce((sum, invoice) => sum + Number(invoice.amountPaid || 0), 0)
    const outstanding = myInvoices.reduce((sum, invoice) => sum + Number(invoice.balanceAmount || 0), 0)
    return { totalAmount, amountPaid, outstanding }
  }, [myInvoices])

  if (!customerId) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Credit tracking</h2>
        <p className="text-sm text-slate-500">
          See your invoices, payments, and remaining credit.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="py-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Stored credit balance</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">{money(customer?.creditBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Total invoiced</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{money(summary.totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Total paid</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{money(summary.amountPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Outstanding credit</p>
            <p className="mt-2 text-2xl font-bold text-red-600">{money(summary.outstanding)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open invoices</CardTitle>
          <CardDescription>Invoices with remaining balance.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myInvoices.filter((invoice) => Number(invoice.balanceAmount || 0) > 0).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-400">
                    No outstanding invoices.
                  </TableCell>
                </TableRow>
              ) : (
                myInvoices
                  .filter((invoice) => Number(invoice.balanceAmount || 0) > 0)
                  .map((invoice) => (
                    <TableRow key={invoice.salesInvoiceId}>
                      <TableCell className="font-medium text-slate-900">{invoice.invoiceNumber}</TableCell>
                      <TableCell className="text-slate-500">{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{money(invoice.totalAmount)}</TableCell>
                      <TableCell className="text-right">{money(invoice.amountPaid)}</TableCell>
                      <TableCell className="text-right font-semibold text-amber-700">{money(invoice.balanceAmount)}</TableCell>
                      <TableCell><Badge variant="outline">{invoice.status}</Badge></TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerCreditTracking