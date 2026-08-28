import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, set } from 'date-fns'
import { CalendarIcon, Tag } from 'lucide-react'
import { toast } from 'sonner'
import type { z } from 'zod'

import { api } from '@/lib/api'
import { EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import ErrorAlert from '@/components/ErrorAlert'
import ErrorMessage from '@/components/ErrorMessage'
import { createEventSchema, type CreateEventInput } from 'core/schemas/events'
import { eventModes, eventStatuses } from 'core/constants'
import { eventMessages } from 'core/messages'
import type { EventResponse } from 'core/types/events'
import type { CategoriesResponse } from 'core/types/categories'
import { useEventsStore } from '@/stores/events-store'

type EventFormProps = {
  event?: EventResponse
  onSuccess: () => void
}

const STATUS_OPTIONS = [
  { value: eventStatuses.published, label: eventStatuses.published },
  { value: eventStatuses.archived, label: eventStatuses.archived },
]

const MODE_OPTIONS = [
  { value: eventModes.online, label: eventModes.online },
  { value: eventModes.offline, label: eventModes.offline },
  { value: eventModes.hybrid, label: eventModes.hybrid },
]

function withTime(day: Date, sourceTime: Date | undefined) {
  return set(day, {
    hours: sourceTime?.getHours() ?? 0,
    minutes: sourceTime?.getMinutes() ?? 0,
    seconds: 0,
    milliseconds: 0,
  })
}

function withTimeString(base: Date, time: string) {
  const [hoursText, minutesText] = time.split(':')
  const hours = Number(hoursText)
  const minutes = Number(minutesText)
  return set(base, { hours, minutes, seconds: 0, milliseconds: 0 })
}

export default function EventForm({ event, onSuccess }: EventFormProps) {
  const isEdit = event !== undefined
  const queryClient = useQueryClient()
  const setCategoriesOpen = useEventsStore((state) => state.setCategoriesOpen)

  const categories = useQuery({
    queryKey: ['event-categories'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CategoriesResponse>('/events/categories', { signal })
      return data
    },
  })

  const { register, handleSubmit, control, watch, formState: { errors, isDirty } } = useForm<z.input<typeof createEventSchema>, unknown, CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: event
      ? {
          title: event.title,
          excerpt: event.excerpt,
          categoryId: event.category.id,
          status: event.status,
          mode: event.mode,
          location: event.location,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
        }
      : {},
  })

  const saveEvent = useMutation({
    mutationFn: async (values: CreateEventInput) => {
      if (isEdit) {
        await api.put(`/events/${event.id}`, values)
        return
      }
      await api.post('/events', values)
    },
    onSuccess: async (_result, values) => {
      await queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success(isEdit ? eventMessages.UPDATED(values.title) : eventMessages.CREATED(values.title))
      onSuccess()
    },
  })

  const hasCategories = categories.isSuccess && categories.data.categories.length > 0
  const mode = watch('mode')
  const locationRequired = mode !== eventModes.online

  return (
    <form onSubmit={handleSubmit((values) => saveEvent.mutate(values))} className="space-y-4" autoComplete="off">
      {saveEvent.isError && (
        <ErrorAlert error={saveEvent.error} fallback={isEdit ? 'Failed to update event.' : 'Failed to create event.'} />
      )}

      <div className="form-field">
        <Label htmlFor="title">Title</Label>
        <Input id="title" autoComplete="off" placeholder="All-hands kickoff" {...register('title')} />
        <ErrorMessage message={errors.title?.message} />
      </div>

      <div className="form-field">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea id="excerpt" autoComplete="off" placeholder="Short summary shown on the event" {...register('excerpt')} />
        <ErrorMessage message={errors.excerpt?.message} />
      </div>

      <div className="form-grid-2">
        <div className="form-field">
          <Label htmlFor="category">Category</Label>

          {categories.isPending && <Skeleton className="skeleton-select" />}
          {categories.isError && <ErrorAlert error={categories.error} fallback="Failed to load categories." />}

          {categories.isSuccess && !hasCategories && (
            <EmptyState icon={Tag} message="No categories yet." compact>
              <Button type="button" variant="outline" size="sm" onClick={() => setCategoriesOpen(true)}>
                Add a category
              </Button>
            </EmptyState>
          )}

          {hasCategories && (
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value ?? null} onValueChange={field.onChange}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Select the category">
                      {(value: number | null) =>
                        categories.data.categories.find((category) => category.id === value)?.name ?? 'Select the category'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.data.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
          <ErrorMessage message={errors.categoryId?.message} />
        </div>

        <div className="form-field">
          <Label htmlFor="status">Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value ?? null} onValueChange={field.onChange}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <ErrorMessage message={errors.status?.message} />
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-field">
          <Label htmlFor="mode">Mode</Label>
          <Controller
            control={control}
            name="mode"
            render={({ field }) => (
              <Select value={field.value ?? null} onValueChange={field.onChange}>
                <SelectTrigger id="mode" className="w-full">
                  <SelectValue placeholder="Select a mode" />
                </SelectTrigger>
                <SelectContent>
                  {MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <ErrorMessage message={errors.mode?.message} />
        </div>

        <div className="form-field">
          <Label htmlFor="location">Location{!locationRequired && <span className="text-muted-foreground"> (optional)</span>}</Label>
          <Input
            id="location"
            autoComplete="off"
            placeholder={locationRequired ? 'Conference Room' : 'Conference Room (optional)'}
            {...register('location')}
          />
          <ErrorMessage message={errors.location?.message} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="form-field">
          <Label>Start Date & Time</Label>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => {
              const value = field.value as Date | undefined
              return (
                <div className="date-time-row">
                  <Popover>
                    <PopoverTrigger
                      render={<Button type="button" variant="outline" className="min-w-0 justify-start font-normal" />}
                    >
                      <CalendarIcon className="shrink-0" />
                      <span className="truncate">{value ? format(value, 'PPP') : 'Pick a date'}</span>
                    </PopoverTrigger>
                    <PopoverContent className="popover-auto">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown"
                        selected={value}
                        onSelect={(day) => day && field.onChange(withTime(day, value))}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    data-testid="start-time-input"
                    className="min-w-0 px-1.5 text-center [&::-webkit-calendar-picker-indicator]:hidden"
                    value={value ? format(value, 'HH:mm') : ''}
                    onChange={(e) => field.onChange(withTimeString(value ?? new Date(), e.target.value))}
                  />
                </div>
              )
            }}
          />
          <ErrorMessage message={errors.startDate?.message} />
        </div>

        <div className="form-field">
          <Label>End Date & Time</Label>
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => {
              const value = field.value as Date | undefined
              return (
                <div className="date-time-row">
                  <Popover>
                    <PopoverTrigger
                      render={<Button type="button" variant="outline" className="min-w-0 justify-start font-normal" />}
                    >
                      <CalendarIcon className="shrink-0" />
                      <span className="truncate">{value ? format(value, 'PPP') : 'Pick a date'}</span>
                    </PopoverTrigger>
                    <PopoverContent className="popover-auto">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown"
                        selected={value}
                        onSelect={(day) => day && field.onChange(withTime(day, value))}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    data-testid="end-time-input"
                    className="min-w-0 px-1.5 text-center [&::-webkit-calendar-picker-indicator]:hidden"
                    value={value ? format(value, 'HH:mm') : ''}
                    onChange={(e) => field.onChange(withTimeString(value ?? new Date(), e.target.value))}
                  />
                </div>
              )
            }}
          />
          <ErrorMessage message={errors.endDate?.message} />
        </div>
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={saveEvent.isPending || !hasCategories || (isEdit && !isDirty)}>
          {isEdit ? (saveEvent.isPending ? 'Saving…' : 'Save Changes') : saveEvent.isPending ? 'Creating…' : 'Create Event'}
        </Button>
      </DialogFooter>
    </form>
  )
}
