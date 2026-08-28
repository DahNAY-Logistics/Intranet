import { CodeNode } from '@lexical/code-core'
import { LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'

import { ContentEditable } from '@/components/content-editable'
import { editorTheme } from '@/components/editor-theme'

type BlogMarkdownContentProps = {
  value: string
}

export default function BlogMarkdownContent({ value }: BlogMarkdownContentProps) {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'BlogContentView',
        editable: false,
        theme: editorTheme,
        nodes: [HeadingNode, QuoteNode, LinkNode, CodeNode, ListNode, ListItemNode],
        onError: (error: Error) => {
          throw error
        },
        editorState: () => $convertFromMarkdownString(value, TRANSFORMERS),
      }}
    >
      <RichTextPlugin contentEditable={<ContentEditable placeholder="" />} ErrorBoundary={LexicalErrorBoundary} />
      <ListPlugin />
      <LinkPlugin />
    </LexicalComposer>
  )
}
