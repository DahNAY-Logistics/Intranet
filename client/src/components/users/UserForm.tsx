import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { UseQueryResult } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CalendarIcon, ChevronsUpDown, Tag } from 'lucide-react'
import { toast } from 'sonner'
import type { z } from 'zod'

import { api } from '@/lib/api'
import { EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import ErrorAlert from '@/components/ErrorAlert'
import ErrorMessage from '@/components/ErrorMessage'
import { createUserSchema, type CreateUserInput } from 'core/schemas/users'
import { roles } from 'core/constants'
import { userMessages } from 'core/messages'
import type { UserDetail, UserLookupItem, UsersLookupResponse } from 'core/types/users'
import type { CategoriesResponse } from 'core/types/categories'
import { useUsersAdminStore } from '@/stores/users-admin-store'

type UserFormProps = {
  user?: UserDetail
  onSuccess: () => void
}

function reportedToLabel(candidate: UserLookupItem) {
  return `${candidate.name}${candidate.employeeId ? ` (${candidate.employeeId})` : ''}`
}

type ReportedToFieldProps = {
  value: string | null
  onChange: (value: string | null) => void
  options: UserLookupItem[]
}

function ReportedToField({ value, onChange, options }: ReportedToFieldProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.id === value) ?? null

  const select = (id: string | null) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id="reportedTo"
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          />
        }
      >
        <span className="truncate">{selected ? reportedToLabel(selected) : 'Select who this user reports to'}</span>
        <ChevronsUpDown className="opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[min(90vw,20rem)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="No manager" data-checked={value === null} onSelect={() => select(null)}>
                No manager
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={reportedToLabel(option)}
                  data-checked={option.id === value}
                  onSelect={() => select(option.id)}
                >
                  {reportedToLabel(option)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type CategoryLookupFieldProps = {
  id: string
  label: string
  query: UseQueryResult<CategoriesResponse>
  value: number | null | undefined
  onChange: (value: number | null) => void
  onAddClick: () => void
  errorMessage?: string
  loadFailedMessage: string
  emptyMessage: string
  addButtonLabel: string
  selectPlaceholder: string
}

function CategoryLookupField({ id, label, query, value, onChange, onAddClick, errorMessage, loadFailedMessage, emptyMessage, addButtonLabel, selectPlaceholder }: CategoryLookupFieldProps) {
  const hasCategories = query.isSuccess && query.data.categories.length > 0

  return (
    <div className="form-field">
      <Label htmlFor={id}>{label}</Label>

      {query.isPending && <Skeleton className="skeleton-select" />}
      {query.isError && <ErrorAlert error={query.error} fallback={loadFailedMessage} />}

      {query.isSuccess && !hasCategories && (
        <EmptyState icon={Tag} message={emptyMessage} compact>
          <Button type="button" variant="outline" size="sm" onClick={onAddClick}>
            {addButtonLabel}
          </Button>
        </EmptyState>
      )}

      {hasCategories && (
        <Select value={value ?? null} onValueChange={onChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={selectPlaceholder} className="min-w-0 truncate">
              {(current: number | null) => {
                const name = query.data.categories.find((category) => category.id === current)?.name
                return <span title={name}>{name ?? selectPlaceholder}</span>
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {query.data.categories.map((category) => (
              <SelectItem key={category.id} value={category.id} title={category.name}>
                <span className="block max-w-64 truncate">{category.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <ErrorMessage message={errorMessage} />
    </div>
  )
}

export default function UserForm({ user, onSuccess }: UserFormProps) {
  const isEdit = user !== undefined
  const queryClient = useQueryClient()
  const setDepartmentsOpen = useUsersAdminStore((state) => state.setDepartmentsOpen)
  const setDesignationsOpen = useUsersAdminStore((state) => state.setDesignationsOpen)
  const setLocationsOpen = useUsersAdminStore((state) => state.setLocationsOpen)

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CategoriesResponse>('/users/departments', { signal })
      return data
    },
  })

  const designations = useQuery({
    queryKey: ['designations'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CategoriesResponse>('/users/designations', { signal })
      return data
    },
  })

  const locations = useQuery({
    queryKey: ['locations'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CategoriesResponse>('/users/locations', { signal })
      return data
    },
  })

  const usersLookup = useQuery({
    queryKey: ['users-lookup', user?.id],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<UsersLookupResponse>('/users/lookup', {
        signal,
        params: { excludeId: user?.id },
      })
      return data
    },
  })

  const { register, handleSubmit, control, formState: { errors, isDirty } } = useForm<z.input<typeof createUserSchema>, unknown, CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: user
      ? {
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId ?? '',
          designationId: user.designation?.id,
          departmentId: user.department?.id,
          locationId: user.location?.id,
          dob: user.dob ? new Date(user.dob) : undefined,
          joinedDate: user.joinedDate ? new Date(user.joinedDate) : undefined,
          reportedToId: user.reportedTo?.id ?? null,
        }
      : {},
  })

  const saveUser = useMutation({
    mutationFn: async (values: CreateUserInput) => {
      if (isEdit) {
        await api.put(`/users/${user.id}`, values)
        return
      }
      await api.post('/users', values)
    },
    onSuccess: async (_data, values) => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(isEdit ? userMessages.UPDATED(values.name) : userMessages.CREATED(values.name))
      onSuccess()
    },
  })

  const hasDepartments = departments.isSuccess && departments.data.categories.length > 0
  const hasDesignations = designations.isSuccess && designations.data.categories.length > 0
  const hasLocations = locations.isSuccess && locations.data.categories.length > 0

  const reportableUsers = useMemo(
    () => (usersLookup.isSuccess ? usersLookup.data.users : []),
    [usersLookup.isSuccess, usersLookup.data],
  )

  return (
    <form onSubmit={handleSubmit((values) => saveUser.mutate(values))} className="space-y-4" autoComplete="off">
      {saveUser.isError && (
        <ErrorAlert error={saveUser.error} fallback={isEdit ? 'Failed to update user.' : 'Failed to create user.'} />
      )}

      <div className="form-field">
        <Label htmlFor="name">Name</Label>
        <Input id="name" autoComplete="off" placeholder="John Wick" {...register('name')} />
        <ErrorMessage message={errors.name?.message} />
      </div>

      <div className="form-field">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="off"
          placeholder="john.wick@dahnay.com"
          {...register('email')}
        />
        <ErrorMessage message={errors.email?.message} />
      </div>

      <div className="form-grid-2">
        <div className="form-field">
          <Label htmlFor="role">Role</Label>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select value={field.value ?? null} onValueChange={field.onChange}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Select the role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={roles.user}>{roles.user}</SelectItem>
                  <SelectItem value={roles.admin}>{roles.admin}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <ErrorMessage message={errors.role?.message} />
        </div>

        <div className="form-field">
          <Label htmlFor="employeeId">Employee ID</Label>
          <Input id="employeeId" autoComplete="off" placeholder="1024" {...register('employeeId')} />
          <ErrorMessage message={errors.employeeId?.message} />
        </div>
      </div>

      <Controller
        control={control}
        name="departmentId"
        render={({ field }) => (
          <CategoryLookupField
            id="department"
            label="Department"
            query={departments}
            value={field.value}
            onChange={field.onChange}
            onAddClick={() => setDepartmentsOpen(true)}
            errorMessage={errors.departmentId?.message}
            loadFailedMessage="Failed to load departments."
            emptyMessage="No departments yet."
            addButtonLabel="Add a department"
            selectPlaceholder="Select the department"
          />
        )}
      />

      <Controller
        control={control}
        name="designationId"
        render={({ field }) => (
          <CategoryLookupField
            id="designation"
            label="Designation"
            query={designations}
            value={field.value}
            onChange={field.onChange}
            onAddClick={() => setDesignationsOpen(true)}
            errorMessage={errors.designationId?.message}
            loadFailedMessage="Failed to load designations."
            emptyMessage="No designations yet."
            addButtonLabel="Add a designation"
            selectPlaceholder="Select the designation"
          />
        )}
      />

      <Controller
        control={control}
        name="locationId"
        render={({ field }) => (
          <CategoryLookupField
            id="location"
            label="Location"
            query={locations}
            value={field.value}
            onChange={field.onChange}
            onAddClick={() => setLocationsOpen(true)}
            errorMessage={errors.locationId?.message}
            loadFailedMessage="Failed to load locations."
            emptyMessage="No locations yet."
            addButtonLabel="Add a location"
            selectPlaceholder="Select the location"
          />
        )}
      />

      <div className="form-field">
        <Label htmlFor="reportedTo">Reported To</Label>

        {usersLookup.isPending && <Skeleton className="skeleton-select" />}
        {usersLookup.isError && <ErrorAlert error={usersLookup.error} fallback="Failed to load users." />}

        {usersLookup.isSuccess && (
          <Controller
            control={control}
            name="reportedToId"
            render={({ field }) => (
              <ReportedToField value={field.value ?? null} onChange={field.onChange} options={reportableUsers} />
            )}
          />
        )}
        <ErrorMessage message={errors.reportedToId?.message} />
      </div>

      <div className="space-y-4">
        <div className="form-field">
          <Label>Date of Birth</Label>
          <Controller
            control={control}
            name="dob"
            render={({ field }) => {
              const value = field.value as Date | undefined
              return (
                <Popover>
                  <PopoverTrigger
                    render={<Button type="button" variant="outline" className="date-trigger-compact" />}
                  >
                    <CalendarIcon className="shrink-0" />
                    <span className="truncate">{value ? format(value, 'PPP') : 'Pick a date'}</span>
                  </PopoverTrigger>
                  <PopoverContent className="popover-auto">
                    <Calendar mode="single" captionLayout="dropdown" selected={value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
              )
            }}
          />
          <ErrorMessage message={errors.dob?.message} />
        </div>

        <div className="form-field">
          <Label>Joined Date</Label>
          <Controller
            control={control}
            name="joinedDate"
            render={({ field }) => {
              const value = field.value as Date | undefined
              return (
                <Popover>
                  <PopoverTrigger
                    render={<Button type="button" variant="outline" className="date-trigger-compact" />}
                  >
                    <CalendarIcon className="shrink-0" />
                    <span className="truncate">{value ? format(value, 'PPP') : 'Pick a date'}</span>
                  </PopoverTrigger>
                  <PopoverContent className="popover-auto">
                    <Calendar mode="single" captionLayout="dropdown" selected={value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
              )
            }}
          />
          <ErrorMessage message={errors.joinedDate?.message} />
        </div>
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button
          type="submit"
          disabled={
            saveUser.isPending ||
            !hasDepartments ||
            !hasDesignations ||
            !hasLocations ||
            !usersLookup.isSuccess ||
            (isEdit && !isDirty)
          }
        >
          {isEdit
            ? saveUser.isPending
              ? 'Saving…'
              : 'Save Changes'
            : saveUser.isPending
              ? 'Creating…'
              : 'Create User'}
        </Button>
      </DialogFooter>
    </form>
  )
}
