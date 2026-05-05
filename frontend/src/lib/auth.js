export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const clearStoredUser = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const resolveRoleRoute = (role) => {
  if (role === 'Admin') return '/admin'
  if (role === 'Staff') return '/staff'
  if (role === 'Customer') return '/customer'
  return '/login'
}
