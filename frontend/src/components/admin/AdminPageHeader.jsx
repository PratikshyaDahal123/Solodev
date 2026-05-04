import { Button } from '../ui/button'

const AdminPageHeader = ({ title, subtitle, onRefresh, actionLabel }) => {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 pb-2">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-500 mb-1">
          Admin dashboard
        </p>
        <h2 className="text-2xl font-bold text-slate-900 leading-tight">{title}</h2>
        {subtitle ? (
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {onRefresh ? (
        <Button
          variant="outline"
          onClick={onRefresh}
          type="button"
          className="border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300"
        >
          {actionLabel ?? 'Refresh'}
        </Button>
      ) : null}
    </div>
  )
}

export default AdminPageHeader
