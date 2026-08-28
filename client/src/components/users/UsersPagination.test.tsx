import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import UsersPagination from './UsersPagination'
import { makeUsersResponse } from './users-fixtures'

type ResponseOverrides = Parameters<typeof makeUsersResponse>[0]

function renderPagination(overrides: ResponseOverrides = {}, onPageChange = vi.fn()) {
  render(
    <UsersPagination pagination={makeUsersResponse(overrides)} onPageChange={onPageChange} onPageSizeChange={vi.fn()} />,
  )
  return within(screen.getByRole('navigation', { name: 'pagination' }))
}

describe('UsersPagination', () => {
  it('renders page links with the current page marked active', () => {
    const nav = renderPagination({ page: 2, totalPages: 3 })

    expect(nav.getByText('1')).toBeInTheDocument()
    expect(nav.getByText('2')).toHaveAttribute('aria-current', 'page')
    expect(nav.getByText('3')).toBeInTheDocument()
  })

  it('collapses distant pages behind an ellipsis', () => {
    const nav = renderPagination({ page: 1, totalPages: 10 })

    expect(nav.getByText('1')).toBeInTheDocument()
    expect(nav.getByText('10')).toBeInTheDocument()
    expect(nav.queryByText('6')).not.toBeInTheDocument()
    expect(nav.getByText('More pages')).toBeInTheDocument()
  })

  it('disables Previous on the first page and Next on the last page', () => {
    const nav = renderPagination({ page: 1, totalPages: 2 })

    expect(nav.getByLabelText('Go to previous page')).toHaveAttribute('aria-disabled', 'true')
    expect(nav.getByLabelText('Go to next page')).toHaveAttribute('aria-disabled', 'false')
  })

  it('calls onPageChange when Previous/Next are clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    const nav = renderPagination({ page: 2, totalPages: 3 }, onPageChange)

    await user.click(nav.getByLabelText('Go to next page'))
    await user.click(nav.getByLabelText('Go to previous page'))

    expect(onPageChange).toHaveBeenNthCalledWith(1, 3)
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1)
  })

  it('calls onPageChange with the clicked page number', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    const nav = renderPagination({ page: 1, totalPages: 3 }, onPageChange)

    await user.click(nav.getByText('3'))

    expect(onPageChange).toHaveBeenCalledWith(3)
  })
})
