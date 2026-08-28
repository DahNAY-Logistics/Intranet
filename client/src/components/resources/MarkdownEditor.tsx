import { useCallback, useEffect, useState } from 'react'
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
} from '@lexical/list'
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { $getNearestNodeOfType } from '@lexical/utils'
import type { EditorState } from 'lexical'
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, FORMAT_TEXT_COMMAND, mergeRegister, SELECTION_CHANGE_COMMAND } from 'lexical'
import { Bold, Italic, List, ListOrdered } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ContentEditable } from '@/components/content-editable'
import { editorTheme } from '@/components/editor-theme'

import { MARKDOWN_TRANSFORMERS } from './markdown-transformers'

type ActiveFormats = {
  bold: boolean
  italic: boolean
  bulletList: boolean
  numberList: boolean
}

function Toolbar() {
  const [editor] = useLexicalComposerContext()
  const [formats, setFormats] = useState<ActiveFormats>({
    bold: false,
    italic: false,
    bulletList: false,
    numberList: false,
  })

  useEffect(() => {
    const updateFormats = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return

        const listNode = $getNearestNodeOfType(selection.anchor.getNode(), ListNode)
        setFormats({
          bold: selection.hasFormat('bold'),
          italic: selection.hasFormat('italic'),
          bulletList: listNode !== null && listNode.getListType() === 'bullet',
          numberList: listNode !== null && listNode.getListType() === 'number',
        })
      })
    }

    return mergeRegister(
      editor.registerUpdateListener(() => updateFormats()),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateFormats()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor])

  return (
    <div className="flex items-center gap-1 border-b p-1">
      <Button
        type="button"
        variant={formats.bold ? 'secondary' : 'ghost'}
        size="icon-sm"
        aria-label="Bold"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
      >
        <Bold />
      </Button>
      <Button
        type="button"
        variant={formats.italic ? 'secondary' : 'ghost'}
        size="icon-sm"
        aria-label="Italic"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
      >
        <Italic />
      </Button>
      <Button
        type="button"
        variant={formats.bulletList ? 'secondary' : 'ghost'}
        size="icon-sm"
        aria-label="Bulleted list"
        onClick={() =>
          editor.dispatchCommand(formats.bulletList ? REMOVE_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
      >
        <List />
      </Button>
      <Button
        type="button"
        variant={formats.numberList ? 'secondary' : 'ghost'}
        size="icon-sm"
        aria-label="Numbered list"
        onClick={() =>
          editor.dispatchCommand(formats.numberList ? REMOVE_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND, undefined)
        }
      >
        <ListOrdered />
      </Button>
    </div>
  )
}

type MarkdownEditorProps = {
  initialValue: string
  onChange: (markdown: string) => void
}

export default function MarkdownEditor({ initialValue, onChange }: MarkdownEditorProps) {
  const handleChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => onChange($convertToMarkdownString(MARKDOWN_TRANSFORMERS)))
    },
    [onChange],
  )

  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'ResourceContent',
        theme: editorTheme,
        nodes: [ListNode, ListItemNode],
        onError: (error: Error) => {
          throw error
        },
        editorState: () => $convertFromMarkdownString(initialValue, MARKDOWN_TRANSFORMERS),
      }}
    >
      <div className="overflow-hidden rounded-md border">
        <Toolbar />
        <RichTextPlugin
          contentEditable={<ContentEditable placeholder="" ariaLabel="Content" />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ListPlugin />
        <OnChangePlugin onChange={handleChange} />
      </div>
    </LexicalComposer>
  )
}
