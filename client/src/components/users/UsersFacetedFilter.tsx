import { CirclePlus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

type UsersFacetedFilterOption = {
  value: string
  label: string
  count?: number
}

type UsersFacetedFilterProps = {
  title: string
  options: UsersFacetedFilterOption[]
  selectedValues: string[]
  onChange: (values: string[]) => void
}

export default function UsersFacetedFilter({ title, options, selectedValues, onChange }: UsersFacetedFilterProps) {
  const selected = new Set(selectedValues)

  const toggle = (value: string) => {
    const next = new Set(selected)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    onChange(Array.from(next))
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" className="border-dashed" />}>
        <CirclePlus />
        {title}
        {selected.size > 0 && (
          <>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
              {selected.size}
            </Badge>
            <div className="hidden gap-1 lg:flex">
              {selected.size > 2 ? (
                <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                  {selected.size} selected
                </Badge>
              ) : (
                options
                  .filter((option) => selected.has(option.value))
                  .map((option) => (
                    <Badge variant="secondary" key={option.value} className="rounded-sm px-1 font-normal">
                      {option.label}
                    </Badge>
                  ))
              )}
            </div>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-50 p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  data-checked={selected.has(option.value)}
                  onSelect={() => toggle(option.value)}
                >
                  <span className="flex-1">{option.label}</span>
                  {typeof option.count === 'number' && (
                    <span className="font-mono text-xs text-muted-foreground">{option.count}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {selected.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem value="__clear__" onSelect={() => onChange([])} className="justify-center text-center">
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
