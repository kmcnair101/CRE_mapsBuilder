import { useState, useRef } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Upload, Building2, Globe, Phone, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { useNavigate } from 'react-router-dom'

export function ProfileSettings() {
  const { user, profile, loadProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [company, setCompany] = useState(profile?.company || '')
  const [website, setWebsite] = useState(profile?.website || '')
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar_url || null)
  const [companyLogo, setCompanyLogo] = useState<string | null>(profile?.company_logo_url || null)
  
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatar(publicUrl)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setError('Failed to upload avatar')
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/logo.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath)

      setCompanyLogo(publicUrl)
    } catch (error) {
      console.error('Error uploading logo:', error)
      setError('Failed to upload company logo')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone,
          company,
          website,
          avatar_url: avatar,
          company_logo_url: companyLogo
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      await loadProfile()
      setError('Profile updated successfully!')
      navigate('/')
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Update your personal and company information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className={cn(
              "p-3 rounded-md text-sm",
              error.includes('success') ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            )}>
              {error}
            </div>
          )}

          {/* Avatar Upload */}
          <div className="flex justify-center">
            <div className="space-y-2">
              <div
                onClick={() => avatarInputRef.current?.click()}
                className={cn(
                  'w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors',
                  'hover:border-blue-500',
                  avatar ? 'border-blue-500' : 'border-gray-300'
                )}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-center text-gray-500">Profile Photo</p>
              <input
                ref={avatarInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1 relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <div className="mt-1 relative">
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://"
                  />
                  <Globe className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo
                </label>
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer',
                    'hover:border-blue-500',
                    companyLogo ? 'border-blue-500' : 'border-gray-300'
                  )}
                >
                  {companyLogo ? (
                    <div className="relative">
                      <img
                        src={companyLogo}
                        alt="Company Logo"
                        className="max-h-32 mx-auto object-contain"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCompanyLogo(null)
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Click to upload company logo
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}