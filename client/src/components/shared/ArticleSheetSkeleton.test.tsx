import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'

import ArticleSheetSkeleton from './ArticleSheetSkeleton'

function countSkeletons() {
  return document.querySelectorAll('[data-slot="skeleton"]').length
}

describe('ArticleSheetSkeleton', () => {
  it('renders inside an article sheet shell', () => {
    render(<ArticleSheetSkeleton />)

    expect(document.querySelector('.article-sheet')).toBeInTheDocument()
    expect(countSkeletons()).toBeGreaterThan(0)
  })

  it('omits the image placeholder by default', () => {
    render(<ArticleSheetSkeleton />)

    expect(document.querySelector('[class*="aspect-"]')).not.toBeInTheDocument()
  })

  it('adds an image placeholder when requested', () => {
    render(<ArticleSheetSkeleton showImage />)

    expect(document.querySelector('[class*="aspect-"]')).toBeInTheDocument()
  })

  it('renders one more placeholder with the image than without', () => {
    const { unmount } = render(<ArticleSheetSkeleton />)
    const without = countSkeletons()
    unmount()

    render(<ArticleSheetSkeleton showImage />)

    expect(countSkeletons()).toBe(without + 1)
  })
})
