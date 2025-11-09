import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './pages/auth/Login'
import RegisterUser from './pages/auth/RegisterUser'
import CallPage from './pages/Call-Page/Call'
import { ToastContainer } from 'react-toastify'
import ProtectedRoute from './routes/protectedRoutes'
export default function App () {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Login />
    },
    {
      path: '/register',
      element: <RegisterUser />
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: '/call',
          element: <CallPage />
        }
      ]
    }
  ])
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer position='top-right' />
    </>
  )
}
