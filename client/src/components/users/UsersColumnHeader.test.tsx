import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTable } from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'

import { columns, features } from './columns'
import UsersColumnHeader from './UsersColumnHeader'

interface HarnessProps {
  columnId?: string
  title?: string
  onSortingChange: (sorting: SortingState) => void
}

function Harness({ columnId = 'employeeId', title = 'Employee ID', onSortingChange }: HarnessProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const table = useTable({
    features,
    columns,
    data: [],
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(next)
      onSortingChange(next)
    },
    manualSorting: true,
  })

  const column = table.getHeaderGroups()[0]?.headers.find((header) => header.column.id === columnId)?.column

  if (!column) return null

  return <UsersColumnHeader column={column} title={title} />
}

describe('UsersColumnHeader', () => {
  it('renders the column title', () => {
    render(<Harness onSortingChange={vi.fn()} />)

    expect(screen.getByText('Employee ID')).toBeInTheDocument()
  })

  it('sorts ascending when Asc is selected from the menu', async () => {
    const user = userEvent.setup()
    const onSortingChange = vi.fn()
    render(<Harness onSortingChange={onSortingChange} />)

    await user.click(screen.getByText('Employee ID'))
    await user.click(await screen.findByText('Asc'))

    expect(onSortingChange).toHaveBeenLastCalledWith([{ id: 'employeeId', desc: false }])
  })

  it('sorts descending when Desc is selected from the menu', async () => {
    const user = userEvent.setup()
    const onSortingChange = vi.fn()
    render(<Harness onSortingChange={onSortingChange} />)

    await user.click(screen.getByText('Employee ID'))
    await user.click(await screen.findByText('Desc'))

    expect(onSortingChange).toHaveBeenLastCalledWith([{ id: 'employeeId', desc: true }])
  })

  it('renders non-sortable columns as plain text with no menu', async () => {
    const user = userEvent.setup()
    const onSortingChange = vi.fn()
    render(<Harness columnId="name" title="Name" onSortingChange={onSortingChange} />)

    const title = screen.getByText('Name')
    expect(title.tagName).toBe('SPAN')

    await user.click(title)

    expect(screen.queryByText('Asc')).not.toBeInTheDocument()
    expect(onSortingChange).not.toHaveBeenCalled()
  })
})
