import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-toastify'
import { useRegisterMutation } from '../services/backendApi'

const RegisterPage = () => {
  const [register, { isLoading, error, data }] = useRegisterMutation()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
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
    const response = await register(form)
    if ('data' in response) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data))
      toast.success('Account created successfully.')
      const role = response.data.role
      if (role === 'Admin') navigate('/admin')
      else if (role === 'Staff') navigate('/staff')
      else navigate('/customer')
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <div className="auth-brand">

        </div>
        <h1 className="auth-card__title">Create Account</h1>
      </div>

      <form className="auth-card__form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Full name</span>
          <input
            name="fullName"
            type="text"
            required
            value={form.fullName}
            onChange={handleChange}
            placeholder="Ram Bahadur Thapa"
          />
        </label>

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
          <span>Phone number</span>
          <input
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            required
            value={form.phoneNumber}
            onChange={handleChange}
            placeholder="+977 9812312345"
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <div className="auth-field__input">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
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
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="auth-card__footer">
        <span>Already have an account?</span>
        <button
          type="button"
          className="auth-link"
          onClick={() => navigate('/login')}
        >
          Sign in
        </button>
      </div>
    </div>
  )
}

export default RegisterPage
