import { ListItemNode, ListNode } from '@lexical/list'
import { $convertFromMarkdownString } from '@lexical/markdown'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'

import { ContentEditable } from '@/components/content-editable'
import { editorTheme } from '@/components/editor-theme'

import { MARKDOWN_TRANSFORMERS } from './markdown-transformers'

type MarkdownContentProps = {
  value: string
}

export default function MarkdownContent({ value }: MarkdownContentProps) {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'ResourceContentView',
        editable: false,
        theme: editorTheme,
        nodes: [ListNode, ListItemNode],
        onError: (error: Error) => {
          throw error
        },
        editorState: () => $convertFromMarkdownString(value, MARKDOWN_TRANSFORMERS),
      }}
    >
      <RichTextPlugin
        contentEditable={<ContentEditable placeholder="" className="min-h-0! overflow-visible! px-0! py-0!" />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <ListPlugin />
    </LexicalComposer>
  )
}
