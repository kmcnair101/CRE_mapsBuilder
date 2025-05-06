import { Fragment } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { 
  MapPin, 
  LogOut,
  LayoutDashboard,
  User,
  CreditCard
} from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'
import { cn } from '@/lib/utils'
import { useSubscription } from '@/hooks/useSubscription'

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, profile } = useAuthStore()
  const { hasAccess } = useSubscription()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard }
  ]

  const userNavigation = [
    { name: 'Profile Settings', href: '/settings/profile', icon: User },
    { name: 'Subscription', href: '/subscription', icon: CreditCard },
  ]

  // Updated function to handle Stripe portal redirection
  async function handleStripePortalRedirect() {
    if (!profile?.id) return
    const res = await fetch('/api/create-portal-link', {
      method: 'POST',
      body: JSON.stringify({ userId: profile.id }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      alert('Could not redirect to Stripe portal.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center">
                  <MapPin className="h-8 w-8 text-blue-500" />
                  <span className="ml-2 text-xl font-bold text-gray-900">Retailer Map</span>
                </Link>
              </div>

              {/* Main Navigation */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2',
                        isActive
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      )}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>


            {/* Right side navigation */}
            <div className="flex items-center space-x-4">
              {/* User Menu */}
              <Menu as="div" className="relative">
                <div>
                  <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center">
                      {profile?.avatar_url ? (
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={profile.avatar_url}
                          alt=""
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {profile?.first_name?.[0] || profile?.email?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="hidden md:flex md:items-center ml-2">
                        <span className="text-sm font-medium text-gray-700 mr-2">
                          {profile?.first_name || profile?.email}
                        </span>
                        <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    {userNavigation.map((item) => (
                      <Menu.Item key={item.name}>
                        {({ active }) => {
                          // Special handling for Subscription link
                          if (item.name === 'Subscription' && hasAccess()) {
                            return (
                              <button
                                onClick={handleStripePortalRedirect}
                                className={cn(
                                  active ? 'bg-gray-100' : '',
                                  'flex w-full px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                <item.icon className="h-4 w-4 mr-2" />
                                {item.name}
                              </button>
                            )
                          }
                          // Default: regular Link
                          return (
                            <Link
                              to={item.href}
                              className={cn(
                                active ? 'bg-gray-100' : '',
                                'flex px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              <item.icon className="h-4 w-4 mr-2" />
                              {item.name}
                            </Link>
                          )
                        }}
                      </Menu.Item>
                    ))}
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => signOut()}
                          className={cn(
                            active ? 'bg-gray-100' : '',
                            'flex w-full px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </nav>

      <main className="h-[calc(100vh-4rem)] relative z-0">
        <Outlet />
      </main>
    </div>
  )
}