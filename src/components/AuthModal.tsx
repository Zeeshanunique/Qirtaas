'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { isAdmin } from '@/utils/adminAuth'
import { useRouter } from 'next/navigation'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        if (isAdmin(userCredential.user.email)) {
          router.push('/admin')
        }
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      onClose()
      setEmail('')
      setPassword('')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      if (isAdmin(userCredential.user.email)) {
        router.push('/admin')
      }
      onClose()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      if (!email) {
        throw new Error('Please enter your email address')
      }
      await sendPasswordResetEmail(auth, email)
      setSuccessMessage('Password reset email sent! Please check your inbox.')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setIsForgotPassword(false)
    setError('')
    setSuccessMessage('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg border border-secondary max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-playfair font-bold text-primary">
            {isForgotPassword 
              ? 'Reset Password' 
              : isLogin 
                ? 'Sign In' 
                : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}

        {isForgotPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-secondary text-accent font-bold py-2 px-4 rounded-lg transition duration-300 ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-sand'
              }`}
            >
              {loading ? 'Processing...' : 'Send Reset Email'}
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-secondary text-accent font-bold py-2 px-4 rounded-lg transition duration-300 ${
                  loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-sand'
                }`}
              >
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            
            <div className="mt-4 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition duration-300 hover:bg-gray-50"
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
            </button>
          </>
        )}

        <div className="mt-4 flex flex-col space-y-2">
          {!isForgotPassword && (
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:text-secondary transition duration-300 text-sm"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          )}
          
          {(isLogin && !isForgotPassword) && (
            <button
              onClick={() => setIsForgotPassword(true)}
              className="text-primary hover:text-secondary transition duration-300 text-sm"
            >
              Forgot your password?
            </button>
          )}
          
          {isForgotPassword && (
            <button
              onClick={resetForm}
              className="text-primary hover:text-secondary transition duration-300 text-sm"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  )
}