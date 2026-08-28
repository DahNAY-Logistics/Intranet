import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import ProfileMenu from '@/components/ProfileMenu'
import { useMe } from '@/hooks/use-me'
import { initials } from '@/lib/utils'

export default function NavUser() {
  const { isMobile } = useSidebar()
  const { data: me } = useMe()

  if (!me) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <ProfileMenu
          me={me}
          side={isMobile ? 'bottom' : 'right'}
          trigger={
            <SidebarMenuButton
              size="lg"
              className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
            />
          }
        >
          <Avatar className="size-8">
            <AvatarImage src={me.image ?? undefined} alt={me.name} />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
              {initials(me.name)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-start text-sm leading-tight">
            <span className="truncate font-semibold">{me.name}</span>
          </div>
        </ProfileMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
