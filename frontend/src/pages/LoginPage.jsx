import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-toastify'
import { useLoginMutation } from '../services/backendApi'
const LoginPage = () => {
  const [login, { isLoading, error, data }] = useLoginMutation()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const errorMessage =
    error?.data?.message ||
    (typeof error?.error === 'string' ? error.error : null)

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage)
    }
  }, [errorMessage])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const response = await login(form)
    if ('data' in response) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data))
      toast.success('Signed in successfully.')
      const role = response.data.role
      if (role === 'Admin') navigate('/admin')
      else if (role === 'Staff') navigate('/staff')
      else navigate('/customer')
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <h1 className="auth-card__title">Sign In</h1>
      </div>

      <form className="auth-card__form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Email address</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="you@company.com"
          />
        </label>

        <label className="auth-field">
          <span className="auth-field__row">
            <span>Password</span>
            <button type="button" className="auth-link auth-link--sm">
              Forgot password?
            </button>
          </span>
          <div className="auth-field__input">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="auth-icon-button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </label>

        <button className="auth-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="auth-card__footer">
        <span>Need an account?</span>
        <button
          type="button"
          className="auth-link"
          onClick={() => navigate('/register')}
        >
          Create one
        </button>
      </div>
    </div>
  )
}

export default LoginPage
