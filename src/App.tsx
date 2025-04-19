import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { MapList } from '@/components/MapList'
import MapEditor from '@/components/MapEditor'
import { AddressSearch } from '@/components/AddressSearch'
import { LogoSearch } from '@/components/LogoSearch'
import { Auth } from '@/components/Auth'
import { ProfileSetup } from '@/components/ProfileSetup'
import { ProfileSettings } from '@/components/settings/ProfileSettings'
import { SubscriptionDetails } from '@/components/settings/SubscriptionDetails'
import { Layout } from '@/components/Layout'

function App() {
  const { loadProfile, loading, user, profile } = useAuthStore()

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  // Determine if user needs to complete profile setup
  const needsProfileSetup = user && profile && !profile.profile_completed

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
        <Route 
          path="/profile/setup" 
          element={
            needsProfileSetup 
              ? <ProfileSetup /> 
              : <Navigate to="/" />
          } 
        />
        <Route path="/" element={<Layout />}>
          <Route 
            index 
            element={
              user 
                ? needsProfileSetup 
                  ? <Navigate to="/profile/setup" />
                  : <MapList />
                : <Navigate to="/auth" />
            } 
          />
          <Route 
            path="maps" 
            element={
              user 
                ? needsProfileSetup 
                  ? <Navigate to="/profile/setup" />
                  : <MapList />
                : <Navigate to="/auth" />
            } 
          />
          <Route 
            path="maps/new/address" 
            element={
              user 
                ? needsProfileSetup 
                  ? <Navigate to="/profile/setup" />
                  : <AddressSearch />
                : <Navigate to="/auth" />
            } 
          />
          <Route 
            path="maps/new" 
            element={
              user 
                ? needsProfileSetup 
                  ? <Navigate to="/profile/setup" />
                  : <MapEditor />
                : <Navigate to="/auth" />
            } 
          />
          <Route 
            path="maps/:id" 
            element={
              user 
                ? needsProfileSetup 
                  ? <Navigate to="/profile/setup" />
                  : <MapEditor />
                : <Navigate to="/auth" />
            } 
          />
          <Route 
            path="logos" 
            element={
              user 
                ? needsProfileSetup 
                  ? <Navigate to="/profile/setup" />
                  : <LogoSearch />
                : <Navigate to="/auth" />
            } 
          />
          <Route 
            path="settings/profile" 
            element={
              user 
                ? needsProfileSetup 
                  ? <Navigate to="/profile/setup" />
                  : <ProfileSettings />
                : <Navigate to="/auth" />
            } 
          />
          <Route 
            path="subscription" 
            element={
              user 
                ? needsProfileSetup 
                  ? <Navigate to="/profile/setup" />
                  : <SubscriptionDetails />
                : <Navigate to="/auth" />
            } 
          />
        </Route>
      </Routes>
    </Router>
  )
}

export default App