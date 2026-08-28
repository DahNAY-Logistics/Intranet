import { Outlet } from 'react-router'

import Footer from '@/components/Footer'
import HomeToaster from '@/components/HomeToaster'
import NavBar from '@/components/NavBar'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-(--home-canvas)">
      <NavBar />
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <Footer />
      <HomeToaster />
    </div>
  )
}
