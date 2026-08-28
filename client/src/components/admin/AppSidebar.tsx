import { Link, useLocation } from 'react-router'

import { adminNavItems } from '@/components/admin/nav-items'
import NavUser from '@/components/admin/NavUser'
import ManifestSeal from '@/components/ManifestSeal'
import { useSettings } from '@/hooks/use-settings'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export default function AppSidebar() {
  const { pathname } = useLocation()
  const { data: settings } = useSettings()

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/home" />}>
              <ManifestSeal className="size-8 border-sidebar-primary/50 text-sidebar-foreground" />
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-heading font-semibold">{settings?.siteName ?? 'Intranet'}</span>
                <span className="text-xs text-sidebar-foreground/70">Admin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={pathname === item.path}
                    tooltip={item.label}
                    render={<Link to={item.path} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
