import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Megaphone } from 'lucide-react'

import StatCard from './StatCard'

describe('StatCard', () => {
  it('renders the label, value, and icon', () => {
    render(<StatCard label="Published Announcements" value={7} icon={Megaphone} />)

    expect(screen.getByText('Published Announcements')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders a zero value', () => {
    render(<StatCard label="Total Banners" value={0} icon={Megaphone} />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
