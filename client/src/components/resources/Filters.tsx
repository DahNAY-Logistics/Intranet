import { ArrowDownWideNarrow, ArrowUpWideNarrow, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import UsersFacetedFilter from '@/components/users/UsersFacetedFilter'
import { resourceStatuses } from 'core/constants'
import type { ResourcesFilterOptionsResponse } from 'core/types/resources'
import type { CategoriesResponse } from 'core/types/categories'
import { useResourcesStore } from '@/stores/resources-store'

const STATUS_VALUES = [
  { value: resourceStatuses.published, label: resourceStatuses.published },
  { value: resourceStatuses.archived, label: resourceStatuses.archived },
]

type FiltersProps = {
  filterOptions?: ResourcesFilterOptionsResponse
}

export default function Filters({ filterOptions }: FiltersProps) {
  const statusFilter = useResourcesStore((state) => state.statusFilter)
  const categoryFilter = useResourcesStore((state) => state.categoryFilter)
  const sortOrder = useResourcesStore((state) => state.sortOrder)
  const setStatusFilter = useResourcesStore((state) => state.setStatusFilter)
  const setCategoryFilter = useResourcesStore((state) => state.setCategoryFilter)
  const setSortOrder = useResourcesStore((state) => state.setSortOrder)

  const categories = useQuery({
    queryKey: ['resource-categories'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CategoriesResponse>('/resources/categories', { signal })
      return data
    },
  })

  const statusOptions = STATUS_VALUES.map((option) => ({
    ...option,
    count: filterOptions?.statuses?.find((status) => status.value === option.value)?.count ?? 0,
  }))

  const categoryOptions = (categories.data?.categories ?? []).map((category) => ({
    value: String(category.id),
    label: category.name,
    count: filterOptions?.categories.find((c) => c.value === String(category.id))?.count ?? 0,
  }))

  const isFiltered = statusFilter.length > 0 || categoryFilter.length > 0

  const resetFilters = () => {
    setStatusFilter([])
    setCategoryFilter([])
  }

  return (
    <div className="filter-row">
      <UsersFacetedFilter title="Status" options={statusOptions} selectedValues={statusFilter} onChange={setStatusFilter} />
      <UsersFacetedFilter title="Category" options={categoryOptions} selectedValues={categoryFilter} onChange={setCategoryFilter} />
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
