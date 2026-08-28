import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useBannersStore } from '@/stores/banners-store'
import { bannerStatuses } from 'core/constants'

vi.mock('@/components/banners', () => ({
  BannerTab: ({ status }: { status: string }) => <div data-testid={`tab-${status}`} />,
  CategoriesDialog: () => <div data-testid="categories-dialog" />,
  CreateDialog: () => <div data-testid="create-dialog" />,
}))

import AdminBannersPage from './AdminBannersPage'

beforeEach(() => {
  useBannersStore.setState({ status: bannerStatuses.published })
})

describe('AdminBannersPage', () => {
  it('renders a heading, create dialog, and categories dialog', () => {
    render(<AdminBannersPage />)

    expect(screen.getByRole('heading', { name: 'Banners' })).toBeInTheDocument()
    expect(screen.getByTestId('create-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('categories-dialog')).toBeInTheDocument()
  })

  it('shows the Published tab by default', () => {
    render(<AdminBannersPage />)

    expect(screen.getByTestId('tab-Published')).toBeInTheDocument()
  })

  it('switches to the Archived tab when clicked', async () => {
    const user = userEvent.setup()
    render(<AdminBannersPage />)

    await user.click(screen.getByRole('tab', { name: 'Archived' }))

    expect(useBannersStore.getState().status).toBe('Archived')
    expect(await screen.findByTestId('tab-Archived')).toBeInTheDocument()
  })

  it('opens the categories dialog store state when the Categories button is clicked', async () => {
    const user = userEvent.setup()
    render(<AdminBannersPage />)

    await user.click(screen.getByRole('button', { name: 'Categories' }))

    expect(useBannersStore.getState().categoriesOpen).toBe(true)
  })
})
