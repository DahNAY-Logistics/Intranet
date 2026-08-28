import { ArrowDownWideNarrow, ArrowUpWideNarrow, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import UsersFacetedFilter from '@/components/users/UsersFacetedFilter'
import { eventModes, eventStatuses } from 'core/constants'
import type { EventsFilterOptionsResponse } from 'core/types/events'
import type { CategoriesResponse } from 'core/types/categories'
import { useEventsStore } from '@/stores/events-store'

const STATUS_VALUES = [
  { value: eventStatuses.published, label: eventStatuses.published },
  { value: eventStatuses.archived, label: eventStatuses.archived },
]

const MODE_VALUES = [
  { value: eventModes.online, label: eventModes.online },
  { value: eventModes.offline, label: eventModes.offline },
  { value: eventModes.hybrid, label: eventModes.hybrid },
]

type FiltersProps = {
  filterOptions?: EventsFilterOptionsResponse
}

export default function Filters({ filterOptions }: FiltersProps) {
  const statusFilter = useEventsStore((state) => state.statusFilter)
  const categoryFilter = useEventsStore((state) => state.categoryFilter)
  const modeFilter = useEventsStore((state) => state.modeFilter)
  const sortOrder = useEventsStore((state) => state.sortOrder)
  const setStatusFilter = useEventsStore((state) => state.setStatusFilter)
  const setCategoryFilter = useEventsStore((state) => state.setCategoryFilter)
  const setModeFilter = useEventsStore((state) => state.setModeFilter)
  const setSortOrder = useEventsStore((state) => state.setSortOrder)

  const categories = useQuery({
    queryKey: ['event-categories'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CategoriesResponse>('/events/categories', { signal })
      return data
    },
  })

  const statusOptions = STATUS_VALUES.map((option) => ({
    ...option,
    count: filterOptions?.statuses?.find((status) => status.value === option.value)?.count ?? 0,
  }))

  const modeOptions = MODE_VALUES.map((option) => ({
    ...option,
    count: filterOptions?.modes.find((mode) => mode.value === option.value)?.count ?? 0,
  }))

  const categoryOptions = (categories.data?.categories ?? []).map((category) => ({
    value: String(category.id),
    label: category.name,
    count: filterOptions?.categories.find((c) => c.value === String(category.id))?.count ?? 0,
  }))

  const isFiltered = statusFilter.length > 0 || categoryFilter.length > 0 || modeFilter.length > 0

  const resetFilters = () => {
    setStatusFilter([])
    setCategoryFilter([])
    setModeFilter([])
  }

  return (
    <div className="filter-row">
      <UsersFacetedFilter title="Status" options={statusOptions} selectedValues={statusFilter} onChange={setStatusFilter} />
      <UsersFacetedFilter title="Category" options={categoryOptions} selectedValues={categoryFilter} onChange={setCategoryFilter} />
      <UsersFacetedFilter title="Mode" options={modeOptions} selectedValues={modeFilter} onChange={setModeFilter} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
      >
        {sortOrder === 'desc' ? <ArrowDownWideNarrow /> : <ArrowUpWideNarrow />}
        {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
      </Button>
      {isFiltered && (
        <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
          Reset
          <X />
        </Button>
      )}
    </div>
  )
}
