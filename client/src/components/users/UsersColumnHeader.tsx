import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import type { Column } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { UserListItem } from 'core/types/users'

import type { features } from './columns'

type UsersColumnHeaderProps = {
  column: Column<typeof features, UserListItem, unknown>
  title: string
}

export default function UsersColumnHeader({ column, title }: UsersColumnHeaderProps) {
  if (!column.getCanSort()) {
    return <span>{title}</span>
  }

  const sorted = column.getIsSorted()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="-ml-2.5 h-8 data-popup-open:bg-accent" />}
      >
        <span>{title}</span>
        {sorted === 'desc' ? <ArrowDown /> : sorted === 'asc' ? <ArrowUp /> : <ChevronsUpDown />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
          <ArrowUp className="text-muted-foreground/70" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
          <ArrowDown className="text-muted-foreground/70" />
          Desc
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
