import { Menu } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import HomeProfileMenu from '@/components/HomeProfileMenu'
import { navItems } from '@/components/nav-items'
import { useMe } from '@/hooks/use-me'
import { useSettings } from '@/hooks/use-settings'
import { useSession } from '@/lib/auth-client'
import { cn, initials } from '@/lib/utils'
import { roles } from 'core/constants'

export default function NavBar() {
  const { data: session } = useSession()
  const { data: settings } = useSettings()
  const { data: me } = useMe()
  const { pathname } = useLocation()

  const isAdmin = session?.user.role === roles.admin
  const siteName = settings?.siteName ?? 'Intranet'
  const monogram = siteName.slice(0, 2).toUpperCase()

  return (
    <header className="nav-shell">
      <div className="nav-content">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="nav-icon-button lg:hidden" />}>
              <Menu />
              <span className="sr-only">Open navigation</span>
            </SheetTrigger>
            <SheetContent side="left" className="nav-sheet">
              <SheetHeader>
                <div className="flex items-center gap-2.5">
                  <span className="nav-logo-mark">{monogram}</span>
                  <SheetTitle className="text-(--home-ink)">{siteName}</SheetTitle>
                </div>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2 pb-4">
                {navItems.map((item) => (
                  <SheetClose key={item.path} render={<Link to={item.path} />}>
                    <span className={cn('nav-sheet-link', pathname === item.path && 'nav-sheet-link-active')}>
                      {item.label}
                    </span>
                  </SheetClose>
                ))}
                {isAdmin && (
                  <SheetClose render={<Link to="/admin" />}>
                    <span className="nav-sheet-link">Admin dashboard</span>
                  </SheetClose>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/home" className="nav-logo">
            <span className="nav-logo-mark">{monogram}</span>
            <span className="nav-logo-text">{siteName}</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 justify-self-center lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.path
            return (
              <Link key={item.path} to={item.path} className={cn('nav-link', active && 'nav-link-active')}>
                {active && <span aria-hidden="true" className="nav-link-pill" />}
                <span className="relative z-10">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center justify-end gap-2">
          {isAdmin && (
            <Link to="/admin" className={cn(buttonVariants({ variant: 'ghost' }), 'nav-pill-button hidden sm:flex')}>
              Admin
            </Link>
          )}
          {me && (
            <HomeProfileMenu me={me} trigger={<Button variant="ghost" size="icon" className="nav-icon-button rounded-full" />}>
              <Avatar className="size-8 rounded-full">
                <AvatarImage src={me.image ?? undefined} alt={me.name} />
                <AvatarFallback className="rounded-full bg-(--home-signal) text-white ring-1 ring-(--home-border)">
                  {initials(me.name)}
                </AvatarFallback>
              </Avatar>
            </HomeProfileMenu>
          )}
        </div>
      </div>
    </header>
  )
}
