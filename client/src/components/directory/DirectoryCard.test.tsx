import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import type { DirectoryEntry } from 'core/types/directory'

import DirectoryCard from './DirectoryCard'

function makeEntry(overrides: Partial<DirectoryEntry> = {}): DirectoryEntry {
  return {
    id: 'u1',
    name: 'Ada Lovelace',
    email: 'ada@dahnay.com',
    image: null,
    employeeId: 'EMP-001',
    reportedTo: { id: 'u2', name: 'Grace Hopper' },
    department: { id: 1, name: 'Engineering' },
    designation: { id: 2, name: 'Principal Engineer' },
    location: { id: 3, name: 'Chennai' },
    joinedDate: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('DirectoryCard', () => {
  it('renders the name, designation and employee id', () => {
    render(<DirectoryCard entry={makeEntry()} />)

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Principal Engineer')).toBeInTheDocument()
    expect(screen.getByText('EMP-001')).toBeInTheDocument()
  })

  it('renders department, location and reporting manager', () => {
    render(<DirectoryCard entry={makeEntry()} />)

    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Chennai')).toBeInTheDocument()
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
  })

  it('renders the email as a mailto link', () => {
    render(<DirectoryCard entry={makeEntry()} />)

    expect(screen.getByRole('link', { name: 'ada@dahnay.com' })).toHaveAttribute('href', 'mailto:ada@dahnay.com')
  })

  it('falls back when designation and relations are missing', () => {
    render(<DirectoryCard entry={makeEntry({ designation: null, department: null, location: null, reportedTo: null })} />)

    expect(screen.getByText('Unassigned')).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(3)
  })

  it('omits the employee id when absent', () => {
    render(<DirectoryCard entry={makeEntry({ employeeId: null })} />)

    expect(screen.queryByText('EMP-001')).not.toBeInTheDocument()
  })
})
