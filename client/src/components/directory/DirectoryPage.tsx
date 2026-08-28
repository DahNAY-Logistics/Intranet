import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SearchIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { api } from '@/lib/api'
import { ErrorState, FeedPagination } from '@/components/shared'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useDirectoryStore } from '@/stores/directory-store'
import type { DirectoryResponse } from 'core/types/directory'

import DirectoryFeed from './DirectoryFeed'
import Filters from './Filters'

const DEFAULT_PAGE_SIZE = 12
const SEARCH_DEBOUNCE_MS = 300

export default function DirectoryPage() {
  const [searchParams] = useSearchParams()
  const sortByParam = searchParams.get('sortBy')
  const sortBy = sortByParam === 'joinedDate' || sortByParam === 'name' ? sortByParam : 'employeeId'
  const sortOrderParam = searchParams.get('sortOrder')
  const sortOrder =
    sortOrderParam === 'asc' || sortOrderParam === 'desc' ? sortOrderParam : sortBy === 'name' ? 'asc' : 'desc'

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  const departmentFilter = useDirectoryStore((state) => state.departmentFilter)
  const designationFilter = useDirectoryStore((state) => state.designationFilter)
  const locationFilter = useDirectoryStore((state) => state.locationFilter)

  const department = departmentFilter.length ? departmentFilter.join(',') : undefined
  const designation = designationFilter.length ? designationFilter.join(',') : undefined
  const location = locationFilter.length ? locationFilter.join(',') : undefined

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, department, designation, location])

  const directory = useQuery({
    queryKey: [
      'directory',
      { page, pageSize: DEFAULT_PAGE_SIZE, search: debouncedSearch, sortBy, sortOrder, department, designation, location },
    ],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<DirectoryResponse>('/directory', {
        params: {
          page,
          pageSize: DEFAULT_PAGE_SIZE,
          search: debouncedSearch || undefined,
          sortBy,
          sortOrder,
          department,
          designation,
          location,
        },
        signal,
      })
      return data
    },
  })

  return (
    <div className="page-stack">
      <div className="home-page-head">
        <p className="home-eyebrow">Staff Ledger</p>
        <h1 className="home-page-title">Directory</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="roster-search">
          <SearchIcon className="roster-search-icon" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or employee ID..."
            className="roster-search-input"
          />
        </div>

        <Filters filterOptions={directory.data?.filterOptions} />
      </div>

      {directory.isError ? (
        <ErrorState error={directory.error} fallback="Failed to load directory." tone="home" />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="roster-ledger">
            <span className="roster-ledger-label">Staff Roster</span>
            <span aria-hidden="true" className="roster-ledger-rule" />
            {directory.isSuccess && (
              <span className="roster-ledger-count">
                {directory.data.totalCount} {directory.data.totalCount === 1 ? 'person' : 'people'}
              </span>
            )}
          </div>

          <DirectoryFeed entries={directory.data?.entries ?? []} isLoading={directory.isPending} />
        </div>
      )}

      {directory.isSuccess && directory.data.totalCount > 0 && (
        <FeedPagination pagination={directory.data} onPageChange={setPage} />
      )}
    </div>
  )
}
