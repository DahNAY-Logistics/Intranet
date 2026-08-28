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

interface ProfileMenuProps {
  me: MeResponse
  trigger: ReactElement
  children: ReactNode
  side?: 'bottom' | 'right'
  align?: 'start' | 'end'
}

export default function ProfileMenu({ me, trigger, children, side = 'bottom', align = 'end' }: ProfileMenuProps) {
  const { signingOut, handleSignOut } = useSignOut()
  const { name, email, employeeId } = me

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger}>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 rounded-lg" side={side} align={align} sideOffset={4}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="grid px-1 py-1.5 text-start text-sm leading-tight">
              <span className="truncate font-semibold">{name}</span>
              <span className="truncate text-xs">{email}</span>
              {employeeId ? (
                <span className="truncate text-xs text-muted-foreground">ID: {employeeId}</span>
              ) : null}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={signingOut} onClick={() => void handleSignOut()}>
          <LogOut />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
