import { useState } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useUsersTableStore } from '@/stores/users-table-store'
import type { UsersFilterOptionsResponse } from 'core/types/users'

import UsersFacetedFilter from './UsersFacetedFilter'
import UsersSearch from './UsersSearch'

type UsersToolbarProps = {
  filterOptions?: UsersFilterOptionsResponse
}

export default function UsersToolbar({ filterOptions }: UsersToolbarProps) {
  const [resetKey, setResetKey] = useState(0)

  const search = useUsersTableStore((state) => state.search)
  const roleFilter = useUsersTableStore((state) => state.roleFilter)
  const departmentFilter = useUsersTableStore((state) => state.departmentFilter)
  const designationFilter = useUsersTableStore((state) => state.designationFilter)
  const locationFilter = useUsersTableStore((state) => state.locationFilter)
  const setSearch = useUsersTableStore((state) => state.setSearch)
  const setRoleFilter = useUsersTableStore((state) => state.setRoleFilter)
  const setDepartmentFilter = useUsersTableStore((state) => state.setDepartmentFilter)
  const setDesignationFilter = useUsersTableStore((state) => state.setDesignationFilter)
  const setLocationFilter = useUsersTableStore((state) => state.setLocationFilter)

  const isFiltered =
    search !== '' ||
    roleFilter.length > 0 ||
    departmentFilter.length > 0 ||
    designationFilter.length > 0 ||
    locationFilter.length > 0

  const resetAll = () => {
    setSearch('')
    setRoleFilter([])
    setDepartmentFilter([])
    setDesignationFilter([])
    setLocationFilter([])
    setResetKey((key) => key + 1)
  }

  return (
    <div className="flex flex-col-reverse items-start gap-2 sm:flex-row sm:items-center">
      <UsersSearch key={resetKey} />
      <div className="header-actions">
        <UsersFacetedFilter
          title="Role"
          options={(filterOptions?.roles ?? []).map((option) => ({
            value: option.value,
            label: option.label ?? option.value,
            count: option.count,
          }))}
          selectedValues={roleFilter}
          onChange={setRoleFilter}
        />
        <UsersFacetedFilter
          title="Department"
          options={(filterOptions?.departments ?? []).map((option) => ({
            value: option.value,
            label: option.label ?? option.value,
            count: option.count,
          }))}
          selectedValues={departmentFilter}
          onChange={setDepartmentFilter}
        />
        <UsersFacetedFilter
          title="Designation"
          options={(filterOptions?.designations ?? []).map((option) => ({
            value: option.value,
            label: option.label ?? option.value,
            count: option.count,
          }))}
          selectedValues={designationFilter}
          onChange={setDesignationFilter}
        />
        <UsersFacetedFilter
          title="Location"
          options={(filterOptions?.locations ?? []).map((option) => ({
            value: option.value,
            label: option.label ?? option.value,
            count: option.count,
          }))}
          selectedValues={locationFilter}
          onChange={setLocationFilter}
        />
        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={resetAll}>
            Reset
            <X />
          </Button>
        )}
      </div>
    </div>
  )
}
