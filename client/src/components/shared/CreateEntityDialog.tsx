import { useState } from 'react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type CreateEntityDialogProps = {
  triggerLabel: string
  triggerIcon: ReactNode
  title: string
  children: (props: { open: boolean; onSuccess: () => void }) => ReactNode
}

export default function CreateEntityDialog({ triggerLabel, triggerIcon, title, children }: CreateEntityDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        {triggerIcon}
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="dialog-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children({ open, onSuccess: () => setOpen(false) })}
      </DialogContent>
    </Dialog>
  )
}
