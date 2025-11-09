import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import type { registerUser } from '../../types/User.type'
import { toast } from 'react-toastify'
import { registerUserApi } from '../../api/auth.api'

interface PasswordState {
  password: string
  confirmPassword: string
  show: {
    pass: boolean
    confirm: boolean
  }
  error?: string
}

export default function RegisterUser () {
  const navigate = useNavigate()
  const [registerPayload, setRegisterPayload] = useState<registerUser>({
    name: '',
    email: '',
    password: ''
  })

  const [passwordState, setPasswordState] = useState<PasswordState>({
    password: '',
    confirmPassword: '',
    show: { pass: false, confirm: false }
  })

  const handlePayloadChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRegisterPayload(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordState(prev => ({
      ...prev,
      [name]: value,
      error:
        name === 'confirmPassword' && value !== prev.password
          ? 'Passwords do not match.'
          : ''
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const response = await registerUserApi(registerPayload)
      console.log(response.data)
      toast.success('registeration sucessfull')
      navigate('/')
    } catch (e) {
      toast.error('error while registering')
      console.log(e)
    }
  }

  useEffect(() => {
    if (
      passwordState.password &&
      passwordState.confirmPassword &&
      passwordState.password === passwordState.confirmPassword
    ) {
      // ✅ Passwords match → update register payload password
      setRegisterPayload(prev => ({
        ...prev,
        password: passwordState.password
      }))

      // ✅ Clear any previous error
      setPasswordState(prev => ({
        ...prev,
        error: ''
      }))
    } else if (
      passwordState.confirmPassword &&
      passwordState.password !== passwordState.confirmPassword
    ) {
      // ❌ Passwords don’t match → show error
      setPasswordState(prev => ({
        ...prev,
        error: 'Passwords do not match.'
      }))
    }
  }, [passwordState.password, passwordState.confirmPassword])

  return (
    <div className='flex min-h-screen flex-col justify-center px-6 py-4 bg-[#0A0A0A] text-gray-100'>
      <div>
        <h2 className='mt-10 text-center text-3xl font-bold tracking-tight text-indigo-400'>
          Create your account
        </h2>
      </div>

      <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Name */}
          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-gray-300'
            >
              Full Name
            </label>
            <input
              id='name'
              name='name'
              type='text'
              placeholder='Enter your name'
              value={registerPayload.name}
              onChange={handlePayloadChange}
              className='mt-2 block w-full rounded-md border border-gray-700 bg-[#111] px-3 py-2 text-gray-100 shadow-sm placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm'
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-300'
            >
              Email address
            </label>
            <input
              id='email'
              name='email'
              type='email'
              placeholder='you@example.com'
              value={registerPayload.email}
              onChange={handlePayloadChange}
              className='mt-2 block w-full rounded-md border border-gray-700 bg-[#111] px-3 py-2 text-gray-100 shadow-sm placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm'
            />
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
                type={passwordState.show.pass ? 'text' : 'password'}
                placeholder='Enter your password'
                value={passwordState.password}
                onChange={handlePasswordChange}
                className='block w-full rounded-md border border-gray-700 bg-[#111] px-3 py-2 text-gray-100 shadow-sm placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm'
              />
              <button
                type='button'
                onClick={() =>
                  setPasswordState(p => ({
                    ...p,
                    show: { ...p.show, pass: !p.show.pass }
                  }))
                }
                className='absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-indigo-400'
              >
                {passwordState.show.pass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-sm font-medium text-gray-300'
            >
              Confirm Password
            </label>
            <div className='mt-2 relative'>
              <input
                id='confirmPassword'
                name='confirmPassword'
                type={passwordState.show.confirm ? 'text' : 'password'}
                placeholder='Re-enter your password'
                value={passwordState.confirmPassword}
                onChange={handlePasswordChange}
                className='block w-full rounded-md border border-gray-700 bg-[#111] px-3 py-2 text-gray-100 shadow-sm placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm'
              />
              <button
                type='button'
                onClick={() =>
                  setPasswordState(p => ({
                    ...p,
                    show: { ...p.show, confirm: !p.show.confirm }
                  }))
                }
                className='absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-indigo-400'
              >
                {passwordState.show.confirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Error */}
          {passwordState.error && (
            <p className='text-red-500 text-sm font-medium text-center'>
              {passwordState.error}
            </p>
          )}

          {/* Submit */}
          <button
            type='submit'
            className='flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200'
          >
            Register
          </button>
        </form>

        <p className='pt-2 text-center text-sm text-gray-400'>
          Already have an account?{' '}
          <Link
            to='/'
            className='font-semibold text-indigo-400 hover:text-indigo-300'
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
