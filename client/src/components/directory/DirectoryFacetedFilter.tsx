import { CirclePlus } from 'lucide-react'

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type DirectoryFacetedFilterOption = {
  value: string
  label: string
  count?: number
}

type DirectoryFacetedFilterProps = {
  title: string
  options: DirectoryFacetedFilterOption[]
  selectedValues: string[]
  onChange: (values: string[]) => void
}

export default function DirectoryFacetedFilter({ title, options, selectedValues, onChange }: DirectoryFacetedFilterProps) {
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
      <PopoverTrigger render={<button type="button" className="roster-filter-trigger" />}>
        <CirclePlus className="size-3.5" />
        {title}
        {selected.size > 0 && (
          <>
            <span aria-hidden="true" className="roster-filter-divider" />
            <span className="roster-filter-count lg:hidden">{selected.size}</span>
            <span className="hidden gap-1 lg:flex">
              {selected.size > 2 ? (
                <span className="roster-filter-chip">{selected.size} selected</span>
              ) : (
                options
                  .filter((option) => selected.has(option.value))
                  .map((option) => (
                    <span key={option.value} className="roster-filter-chip">
                      {option.label}
                    </span>
                  ))
              )}
            </span>
          </>
        )}
      </PopoverTrigger>

      <PopoverContent className="roster-filter-panel" align="start">
        <Command className="roster-filter-command">
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty className="roster-filter-empty">No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  data-checked={selected.has(option.value)}
                  onSelect={() => toggle(option.value)}
                  className="roster-filter-item"
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {typeof option.count === 'number' && (
                    <span className="roster-filter-tally">{option.count}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {selected.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem value="__clear__" onSelect={() => onChange([])} className="roster-filter-clear">
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
