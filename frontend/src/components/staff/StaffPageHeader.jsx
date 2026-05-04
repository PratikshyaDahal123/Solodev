const StaffPageHeader = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 pb-2">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-600 mb-1">
          Staff dashboard
        </p>
        <h2 className="text-2xl font-bold text-slate-900 leading-tight">{title}</h2>
        {subtitle ? (
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

export default StaffPageHeader
