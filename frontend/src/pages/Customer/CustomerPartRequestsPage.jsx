import CustomerPartRequests from './CustomerPartRequests'

const CustomerPartRequestsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Unavailable parts</h2>
        <p className="text-sm text-slate-500">
          Request parts that are currently out of stock or unavailable.
        </p>
      </div>
      <CustomerPartRequests />
    </div>
  )
}

export default CustomerPartRequestsPage