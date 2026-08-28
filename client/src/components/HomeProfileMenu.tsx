import type { ReactElement, ReactNode } from 'react'
import { LogOut } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSignOut } from '@/hooks/use-sign-out'
import type { MeResponse } from 'core/types/users'

interface HomeProfileMenuProps {
  me: MeResponse
  trigger: ReactElement
  children: ReactNode
}

export default function HomeProfileMenu({ me, trigger, children }: HomeProfileMenuProps) {
  const { signingOut, handleSignOut } = useSignOut()
  const { name, email, employeeId } = me

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger}>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-60 rounded-xl border border-dashed border-(--home-border) bg-(--home-surface) p-1.5 text-(--home-ink) shadow-none ring-0"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="grid gap-1 px-2 py-2 text-start">
              <span className="truncate font-heading text-sm font-bold tracking-tight text-(--home-ink)">{name}</span>
              <span className="truncate font-mono text-[11px] text-(--home-muted)">{email}</span>
              {employeeId ? (
                <span className="truncate font-mono text-[10px] tracking-[0.12em] text-(--home-muted) uppercase">
                  ID: {employeeId}
                </span>
              ) : null}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="-mx-1.5 my-1.5 h-0 border-t border-dashed border-(--home-border) bg-transparent" />
        <DropdownMenuItem
          variant="destructive"
          disabled={signingOut}
          onClick={() => void handleSignOut()}
          className="gap-2 rounded-sm px-2 py-2 font-mono text-[11px] font-medium tracking-widest uppercase data-[variant=destructive]:text-(--home-signal) data-[variant=destructive]:*:[svg]:text-(--home-signal) data-[variant=destructive]:focus:bg-(--home-signal)/10 data-[variant=destructive]:focus:text-(--home-signal) dark:data-[variant=destructive]:focus:bg-(--home-signal)/15"
        >
          <LogOut />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
