import { useEffect, useState } from 'react'
import { SearchIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useUsersTableStore } from '@/stores/users-table-store'

const SEARCH_DEBOUNCE_MS = 300

export default function UsersSearch() {
  const search = useUsersTableStore((state) => state.search)
  const setSearch = useUsersTableStore((state) => state.setSearch)

  const [value, setValue] = useState(search)
  const debouncedValue = useDebouncedValue(value, SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    setSearch(debouncedValue)
  }, [debouncedValue, setSearch])

  return (
    <div className="relative w-full max-w-sm">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by name, email, or employee ID..."
        className="pl-8"
      />
    </div>
  )
}
