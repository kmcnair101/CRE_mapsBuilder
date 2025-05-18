import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useLocation } from 'react-router-dom'

interface PricingPlanProps {
  isOpen: boolean
  onClose: () => void
}

export function PricingPlans({ isOpen, onClose }: PricingPlanProps) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const location = useLocation()

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id, 
          plan,
          returnUrl: window.location.href // Pass the current