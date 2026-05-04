import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { backendApi } from '../services/backendApi'

export const store = configureStore({
  reducer: {
    [backendApi.reducerPath]: backendApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(backendApi.middleware),
})

setupListeners(store.dispatch)
