import { useState } from 'react'
import { UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import UserForm from './UserForm'

export default function CreateUserDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <UserPlus />
        Create User
      </DialogTrigger>
      <DialogContent className="dialog-md">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>Add a new user to the intranet.</DialogDescription>
        </DialogHeader>
        <UserForm key={String(open)} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
