const DashboardHeader = ({ eyebrow, title, right }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 h-14 bg-white border-b border-gray-200">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 mb-0.5">
            {eyebrow}
          </p>
        )}
        {title && (
          <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
        )}
      </div>
      {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
    </header>
  )
}

export default DashboardHeader
