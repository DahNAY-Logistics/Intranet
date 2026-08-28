import { X } from 'lucide-react'

import { useDirectoryStore } from '@/stores/directory-store'
import type { DirectoryFilterOption, DirectoryFilterOptionsResponse } from 'core/types/directory'

import DirectoryFacetedFilter from './DirectoryFacetedFilter'

type FiltersProps = {
  filterOptions?: DirectoryFilterOptionsResponse
}

function toOptions(options: DirectoryFilterOption[] = []) {
  return options.map((option) => ({
    value: option.value,
    label: option.label ?? option.value,
    count: option.count,
  }))
}

export default function Filters({ filterOptions }: FiltersProps) {
  const departmentFilter = useDirectoryStore((state) => state.departmentFilter)
  const designationFilter = useDirectoryStore((state) => state.designationFilter)
  const locationFilter = useDirectoryStore((state) => state.locationFilter)
  const setDepartmentFilter = useDirectoryStore((state) => state.setDepartmentFilter)
  const setDesignationFilter = useDirectoryStore((state) => state.setDesignationFilter)
  const setLocationFilter = useDirectoryStore((state) => state.setLocationFilter)
  const resetFilters = useDirectoryStore((state) => state.resetFilters)

  const isFiltered = departmentFilter.length > 0 || designationFilter.length > 0 || locationFilter.length > 0

  return (
    <div className="filter-row">
      <DirectoryFacetedFilter
        title="Department"
        options={toOptions(filterOptions?.departments)}
        selectedValues={departmentFilter}
        onChange={setDepartmentFilter}
      />
      <DirectoryFacetedFilter
        title="Designation"
        options={toOptions(filterOptions?.designations)}
        selectedValues={designationFilter}
        onChange={setDesignationFilter}
      />
      <DirectoryFacetedFilter
        title="Location"
        options={toOptions(filterOptions?.locations)}
        selectedValues={locationFilter}
        onChange={setLocationFilter}
      />
      {isFiltered && (
        <button type="button" className="roster-filter-reset" onClick={resetFilters}>
          Reset
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
