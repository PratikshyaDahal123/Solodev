import { useEffect } from 'react'
import { X } from 'lucide-react'

const PopoverModal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  contentStyle,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <div
        className={[
          'relative w-full max-w-md rounded-3xl border border-cyan-100 bg-white p-6 shadow-xl shadow-cyan-100/60',
          'max-h-[85vh] overflow-y-auto',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={contentStyle}
      >
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-600"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="space-y-2">
          {title ? (
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          ) : null}
          {description ? (
            <p className="text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {children ? <div className="mt-4 space-y-3">{children}</div> : null}
        {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  )
}

export default PopoverModal
