import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import type { DirectoryEntry } from 'core/types/directory'

import DirectoryFeed from './DirectoryFeed'

const mockEntries: DirectoryEntry[] = [
  {
    id: 'u1',
    name: 'Ada Lovelace',
    email: 'ada@dahnay.com',
    image: null,
    employeeId: 'EMP-001',
    reportedTo: null,
    department: { id: 1, name: 'Engineering' },
    designation: { id: 2, name: 'Principal Engineer' },
    location: { id: 3, name: 'Chennai' },
    joinedDate: '2026-01-01T00:00:00.000Z',
  },
]

function renderFeed(props: Partial<Parameters<typeof DirectoryFeed>[0]> = {}) {
  return render(<DirectoryFeed entries={mockEntries} {...props} />)
}

describe('DirectoryFeed', () => {
  it('renders a card per entry', () => {
    renderFeed()

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
  })

  it('shows the default empty message when there are none', () => {
    renderFeed({ entries: [] })

    expect(screen.getByText('No matching staff found.')).toBeInTheDocument()
  })

  it('renders placeholders and no cards while loading', () => {
    renderFeed({ isLoading: true })

    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument()
    expect(screen.queryByText('No matching staff found.')).not.toBeInTheDocument()
  })
})
