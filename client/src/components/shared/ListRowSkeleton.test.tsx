import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'

import ListRowSkeleton from './ListRowSkeleton'

function countSkeletons() {
  return document.querySelectorAll('[data-slot="skeleton"]').length
}

describe('ListRowSkeleton', () => {
  it('renders three rows by default', () => {
    render(<ListRowSkeleton />)

    expect(document.querySelectorAll('.list-row')).toHaveLength(3)
  })

  it('renders the requested number of rows', () => {
    render(<ListRowSkeleton rows={5} />)

    expect(document.querySelectorAll('.list-row')).toHaveLength(5)
  })

  it('renders one fewer placeholder per row when the meta line is hidden', () => {
    const { unmount } = render(<ListRowSkeleton rows={1} />)
    const withMeta = countSkeletons()
    unmount()

    render(<ListRowSkeleton rows={1} showMeta={false} />)

    expect(countSkeletons()).toBe(withMeta - 1)
  })

  it('applies the meta width to the meta placeholder', () => {
    render(<ListRowSkeleton rows={1} metaWidth="w-40" />)

    expect(document.querySelector('.w-40')).toBeInTheDocument()
  })
})
