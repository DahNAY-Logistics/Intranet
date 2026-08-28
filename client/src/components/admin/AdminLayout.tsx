import { Outlet } from 'react-router'

import AppSidebar from '@/components/admin/AppSidebar'
import ApiStatus from '@/components/ApiStatus'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function AdminLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4 sm:px-6">
            <SidebarTrigger />
            <div className="ml-auto">
              <ApiStatus />
            </div>
          </header>
          <div className="px-4 py-6 sm:px-6 sm:py-8">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  )
}
