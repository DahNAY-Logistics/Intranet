import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import MarkdownContent from './MarkdownContent'

describe('MarkdownContent', () => {
  it('renders bold, italic, and list content from markdown', () => {
    render(<MarkdownContent value={'**bold text** and *italic text*\n\n- one\n- two\n\n1. first\n2. second'} />)

    expect(screen.getByText('bold text').tagName).toBe('STRONG')
    expect(screen.getByText('italic text').tagName).toBe('EM')
    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByText('two')).toBeInTheDocument()
    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.getByText('second')).toBeInTheDocument()
  })

  it('is not editable', () => {
    render(<MarkdownContent value="plain text" />)

    expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'false')
  })
})
