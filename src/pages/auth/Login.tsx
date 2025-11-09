import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import type { loginUser } from '../../types/User.type'
import { toast } from 'react-toastify'
import { loginUserApi } from '../../api/auth.api'
import { useUser } from '../../context/us/UserContext'

interface UIState {
  showPass: boolean
  error?: string
}

export default function Login () {
  const [payload, setPayload] = useState<loginUser>({
    email: '',
    password: ''
  })
  const { setUserPayload } = useUser()
  const navigate = useNavigate()
  const [ui, setUi] = useState<UIState>({
    showPass: false,
    error: ''
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPayload(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!payload.email || !payload.password) {
      setUi(prev => ({ ...prev, error: 'Please fill in both fields.' }))
      return
    }

    if (!payload.email.includes('@')) {
      setUi(prev => ({ ...prev, error: 'Enter a valid email address.' }))
      return
    }
    try {
      const response = await loginUserApi(payload)
      console.log('response of login is :', response.data)
      sessionStorage.setItem(
        'authToken',
        JSON.stringify({ token: response.data.token.accessToken })
      )
      setUserPayload(response.data.user)
      navigate('/call')
    } catch (e) {
      toast.error('error while login')
      console.log(e)
    }
    console.log('✅ Login Payload:', payload)
    setUi(prev => ({ ...prev, error: '' }))
  }

  return (
    <div className='flex min-h-screen flex-col justify-center px-6 py-12 bg-[#0A0A0A] text-gray-100'>
      <div className='sm:mx-auto sm:w-full sm:max-w-sm'>
        <img
          alt='Your Company'
          src='https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500'
          className='mx-auto h-10 w-auto'
        />
        <h2 className='mt-10 text-center text-3xl font-bold tracking-tight text-indigo-400'>
          Sign in to your account
        </h2>
      </div>

      <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Email */}
          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-300'
            >
              Email address
            </label>
            <div className='mt-2'>
              <input
                id='email'
                name='email'
                type='email'
                placeholder='you@example.com'
                value={payload.email}
                onChange={handleChange}
                className='block w-full rounded-md border border-gray-700 bg-[#111] px-3 py-2 text-gray-100 shadow-sm placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm'
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-300'
            >
              Password
            </label>
            <div className='mt-2 relative'>
              <input
                id='password'
                name='password'
                type={ui.showPass ? 'text' : 'password'}
                placeholder='Enter your password'
                value={payload.password}
                onChange={handleChange}
                className='block w-full rounded-md border border-gray-700 bg-[#111] px-3 py-2 text-gray-100 shadow-sm placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm'
              />
              <button
                type='button'
                onClick={() =>
                  setUi(prev => ({ ...prev, showPass: !prev.showPass }))
                }
                className='absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-indigo-400'
              >
                {ui.showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Error */}
          {ui.error && (
            <p className='text-red-500 text-sm font-medium text-center'>
              {ui.error}
            </p>
          )}

          {/* Submit */}
          <button
            type='submit'
            className='flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200'
          >
            Sign in
          </button>
        </form>

        <p className='mt-10 text-center text-sm text-gray-400'>
          Don’t have an account?{' '}
          <Link
            to='/register'
            className='font-semibold text-indigo-400 hover:text-indigo-300'
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  )
}
