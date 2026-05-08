import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5232/api'

export const backendApi = createApi({
  reducerPath: 'backendApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token')
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: [
    'Parts',
    'Vendors',
    'Staff',
    'Customers',
    'Appointments',
    'Reviews',
    'Invoices',
    'Reports',
    'Categories',
    'Notifications',
  ],
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    login: builder.mutation({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),

    triggerLowStockNotifications: builder.mutation({
      query: () => ({
        url: '/admin/notifications/low-stock',
        method: 'POST',
      }),
    }),
    triggerOverdueReminders: builder.mutation({
      query: (overdueDays = 30) => ({
        url: '/admin/notifications/overdue-reminders',
        method: 'POST',
        params: { overdueDays },
      }),
    }),

    bookAppointment: builder.mutation({
      query: (body) => ({
        url: '/appointment',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Appointments', 'Notifications'],
    }),
    getAppointmentsByCustomer: builder.query({
      query: (customerId) => `/appointment/customer/${customerId}`,
      providesTags: ['Appointments'],
    }),
    getAppointments: builder.query({
      query: () => '/appointment',
      providesTags: ['Appointments'],
    }),
    updateAppointmentStatus: builder.mutation({
      query: ({ appointmentId, ...body }) => ({
        url: `/appointment/${appointmentId}/status`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Appointments', 'Notifications'],
    }),

    registerCustomer: builder.mutation({
      query: (body) => ({
        url: '/customer/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Customers'],
    }),
    getCustomerById: builder.query({
      query: (customerId) => `/customer/${customerId}`,
      providesTags: ['Customers'],
    }),
    searchCustomers: builder.query({
      query: (term = '') => ({
        url: '/customer/search',
        params: { term },
      }),
      providesTags: ['Customers'],
    }),
    createReview: builder.mutation({
      query: ({ customerId, ...body }) => ({
        url: `/customer/${customerId}/reviews`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Reviews'],
    }),
    getAllReviews: builder.query({
      query: () => '/customer/reviews/all',
      providesTags: ['Reviews'],
    }),
    getReviewsForStaff: builder.query({
      query: (staffId) => `/customer/reviews/staff/${staffId}`,
      providesTags: ['Reviews'],
    }),
    getCustomerHistory: builder.query({
      query: (customerId) => `/customer/${customerId}/history`,
      providesTags: ['Customers'],
    }),
    updateCustomerProfile: builder.mutation({
      query: ({ customerId, ...body }) => ({
        url: `/customer/${customerId}/profile`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Customers'],
    }),
    deleteCustomer: builder.mutation({
      query: (customerId) => ({
        url: `/customer/${customerId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customers'],
    }),
    addCustomerVehicle: builder.mutation({
      query: ({ customerId, ...body }) => ({
        url: `/customer/${customerId}/vehicles`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Customers'],
    }),
    updateCustomerVehicle: builder.mutation({
      query: ({ customerId, vehicleId, ...body }) => ({
        url: `/customer/${customerId}/vehicles/${vehicleId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Customers'],
    }),
    deleteCustomerVehicle: builder.mutation({
      query: ({ customerId, vehicleId }) => ({
        url: `/customer/${customerId}/vehicles/${vehicleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customers'],
    }),

    getPurchaseInvoices: builder.query({
      query: () => '/invoice/purchase',
      providesTags: ['Invoices'],
    }),
    createPurchaseInvoice: builder.mutation({
      query: (body) => ({
        url: '/invoice/purchase',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Invoices', 'Parts', 'Notifications'],
    }),
    updatePurchaseInvoice: builder.mutation({
      query: ({ purchaseInvoiceId, ...body }) => ({
        url: `/invoice/purchase/${purchaseInvoiceId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Invoices', 'Parts', 'Notifications'],
    }),
    deletePurchaseInvoice: builder.mutation({
      query: (purchaseInvoiceId) => ({
        url: `/invoice/purchase/${purchaseInvoiceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Invoices', 'Parts', 'Notifications'],
    }),

    getSalesInvoices: builder.query({
      query: () => '/invoice/sales',
      providesTags: ['Invoices'],
    }),
    createSalesInvoice: builder.mutation({
      query: (body) => ({
        url: '/invoice/sales',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Invoices', 'Parts', 'Notifications'],
    }),
    sendSalesInvoiceEmail: builder.mutation({
      query: ({ salesInvoiceId, email }) => ({
        url: `/invoice/sales/${salesInvoiceId}/send-email`,
        method: 'POST',
        body: { email },
      }),
    }),

    getParts: builder.query({
      query: () => '/parts',
      providesTags: ['Parts'],
    }),
    getPartById: builder.query({
      query: (partId) => `/parts/${partId}`,
      providesTags: ['Parts'],
    }),
    createPart: builder.mutation({
      query: (body) => ({
        url: '/parts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Parts'],
    }),
    updatePart: builder.mutation({
      query: ({ partId, ...body }) => ({
        url: `/parts/${partId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Parts'],
    }),
    deletePart: builder.mutation({
      query: (partId) => ({
        url: `/parts/${partId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Parts'],
    }),

    createPartRequest: builder.mutation({
      query: ({ customerId, ...body }) => ({
        url: `/customer/${customerId}/part-requests`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Parts'],
    }),
    getPartRequestsByCustomer: builder.query({
      query: (customerId) => `/customer/${customerId}/part-requests`,
      providesTags: ['Parts'],
    }),

    getFinancialReport: builder.query({
      query: ({ period = 'monthly', date } = {}) => {
        const params = { period }
        if (date) {
          params.date = date
        }
        return {
          url: '/report/financial',
          params,
        }
      },
      providesTags: ['Reports'],
    }),
    getRegularCustomersReport: builder.query({
      query: (minPurchases = 3) => ({
        url: '/report/customers/regular',
        params: { minPurchases },
      }),
      providesTags: ['Reports'],
    }),
    getHighSpendersReport: builder.query({
      query: (minSpent = 5000) => ({
        url: '/report/customers/high-spenders',
        params: { minSpent },
      }),
      providesTags: ['Reports'],
    }),
    getPendingCreditsReport: builder.query({
      query: (overdueDays = 30) => ({
        url: '/report/customers/pending-credits',
        params: { overdueDays },
      }),
      providesTags: ['Reports'],
    }),

    getStaff: builder.query({
      query: () => '/staff',
      providesTags: ['Staff'],
    }),
    registerStaff: builder.mutation({
      query: (body) => ({
        url: '/staff/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Staff'],
    }),
    updateStaffRole: builder.mutation({
      query: ({ staffId, ...body }) => ({
        url: `/staff/${staffId}/role`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Staff'],
    }),
    updateStaff: builder.mutation({
      query: ({ staffId, ...body }) => ({
        url: `/staff/${staffId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Staff'],
    }),
    deleteStaff: builder.mutation({
      query: (staffId) => ({
        url: `/staff/${staffId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Staff'],
    }),

    getVendors: builder.query({
      query: () => '/vendor',
      providesTags: ['Vendors'],
    }),
    getVendorById: builder.query({
      query: (vendorId) => `/vendor/${vendorId}`,
      providesTags: ['Vendors'],
    }),
    createVendor: builder.mutation({
      query: (body) => ({
        url: '/vendor',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Vendors'],
    }),
    updateVendor: builder.mutation({
      query: ({ vendorId, ...body }) => ({
        url: `/vendor/${vendorId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Vendors'],
    }),
    deleteVendor: builder.mutation({
      query: (vendorId) => ({
        url: `/vendor/${vendorId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Vendors'],
    }),

    getCategories: builder.query({
      query: () => '/category',
      providesTags: ['Categories'],
    }),
    createCategory: builder.mutation({
      query: (body) => ({
        url: '/category',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Categories'],
    }),
    updateCategory: builder.mutation({
      query: ({ categoryId, ...body }) => ({
        url: `/category/${categoryId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Categories'],
    }),
    deleteCategory: builder.mutation({
      query: (categoryId) => ({
        url: `/category/${categoryId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Categories'],
    }),

    // Notifications
    getNotifications: builder.query({
      query: (isRead) => ({
        url: '/notifications',
        params: isRead !== undefined ? { isRead } : undefined,
      }),
      providesTags: ['Notifications'],
    }),
    markNotificationAsRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsAsRead: builder.mutation({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useTriggerLowStockNotificationsMutation,
  useTriggerOverdueRemindersMutation,
  useBookAppointmentMutation,
  useGetAppointmentsQuery,
  useGetAppointmentsByCustomerQuery,
  useUpdateAppointmentStatusMutation,
  useRegisterCustomerMutation,
  useGetCustomerByIdQuery,
  useSearchCustomersQuery,
  useCreateReviewMutation,
  useGetAllReviewsQuery,
  useGetReviewsForStaffQuery,
  useGetCustomerHistoryQuery,
  useUpdateCustomerProfileMutation,
  useDeleteCustomerMutation,
  useAddCustomerVehicleMutation,
  useUpdateCustomerVehicleMutation,
  useDeleteCustomerVehicleMutation,
  useGetPurchaseInvoicesQuery,
  useCreatePurchaseInvoiceMutation,
  useUpdatePurchaseInvoiceMutation,
  useDeletePurchaseInvoiceMutation,
  useGetSalesInvoicesQuery,
  useCreateSalesInvoiceMutation,
  useSendSalesInvoiceEmailMutation,
  useGetPartsQuery,
  useGetPartByIdQuery,
  useCreatePartMutation,
  useUpdatePartMutation,
  useDeletePartMutation,
  useCreatePartRequestMutation,
  useGetPartRequestsByCustomerQuery,
  useGetFinancialReportQuery,
  useGetRegularCustomersReportQuery,
  useGetHighSpendersReportQuery,
  useGetPendingCreditsReportQuery,
  useGetStaffQuery,
  useRegisterStaffMutation,
  useUpdateStaffRoleMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useGetVendorsQuery,
  useGetVendorByIdQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} = backendApi
