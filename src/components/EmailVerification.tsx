import { useLocation } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useState } from 'react'

export function EmailVerification() {
  // Get the email from the location state that we'll pass during signup
  const location = useLocation()
  const email = location.state?.email
  const { resendVerificationEmail } = useAuthStore()
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const handleResend = async () => {
    if (!email) return
    
    try {
      setResending(true)
      await resendVerificationEmail(email)
      setResendSuccess(true)
    } catch (error) {
      console.error('Error resending verification email:', error)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mx-auto mb-4">
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Verify your email address
          </h1>
          
          <div className="space-y-4 text-gray-600">
            <p>
              We have sent a verification link to{' '}
              <strong className="font-medium text-gray-900">{email}</strong>
            </p>
            <p>Click the button in the email to complete the verification process.</p>
          </div>

          <div className="mt-8 space-y-4">
            {resendSuccess ? (
              <p className="text-sm text-green-600">
                Verification email has been resent!
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
            <p className="text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 