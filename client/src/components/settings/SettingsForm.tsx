import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import ErrorAlert from '@/components/ErrorAlert'
import ErrorMessage from '@/components/ErrorMessage'
import { useSettings } from '@/hooks/use-settings'
import { updateSettingsSchema, type UpdateSettingsInput } from 'core/schemas/settings'
import { settingsMessages } from 'core/messages'

export default function SettingsForm() {
  const queryClient = useQueryClient()
  const settings = useSettings()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<UpdateSettingsInput>({
    resolver: zodResolver(updateSettingsSchema),
    values: settings.data,
  })

  const saveSettings = useMutation({
    mutationFn: async (values: UpdateSettingsInput) => {
      await api.put('/settings', values)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success(settingsMessages.UPDATED)
    },
  })

  if (settings.isPending) {
    return (
      <div className="stack-4 max-w-xl">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="form-field">
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="skeleton-input rounded-md" />
          </div>
        ))}
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    )
  }

  if (settings.isError) {
    return <ErrorAlert error={settings.error} fallback="Failed to load settings." />
  }

  return (
    <form
      onSubmit={handleSubmit((values) => saveSettings.mutate(values))}
      className="max-w-xl space-y-4"
      autoComplete="off"
    >
      {saveSettings.isError && <ErrorAlert error={saveSettings.error} fallback="Failed to update settings." />}

      <div className="form-field">
        <Label htmlFor="siteName">Site name</Label>
        <Input id="siteName" autoComplete="off" placeholder="Intranet" {...register('siteName')} />
        <ErrorMessage message={errors.siteName?.message} />
      </div>

      <div className="form-field">
        <Label htmlFor="organizationName">Organization name</Label>
        <Input
          id="organizationName"
          autoComplete="off"
          placeholder="DahNAY Logistics Pvt Ltd"
          {...register('organizationName')}
        />
        <ErrorMessage message={errors.organizationName?.message} />
      </div>

      <div className="form-field">
        <Label htmlFor="supportEmail">Support email</Label>
        <Input
          id="supportEmail"
          type="email"
          autoComplete="off"
          placeholder="support@dahnay.com"
          {...register('supportEmail')}
        />
        <ErrorMessage message={errors.supportEmail?.message} />
      </div>

      <div className="form-field">
        <Label htmlFor="codeOfConductUrl">Code of Conduct URL</Label>
        <Controller
          control={control}
          name="codeOfConductUrl"
          render={({ field }) => (
            <Input
              id="codeOfConductUrl"
              type="url"
              autoComplete="off"
              placeholder="https://example.com/code-of-conduct"
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
            />
          )}
        />
        <ErrorMessage message={errors.codeOfConductUrl?.message} />
      </div>

      <div className="form-field">
        <Label htmlFor="privacyPolicyUrl">Privacy Policy URL</Label>
        <Controller
          control={control}
          name="privacyPolicyUrl"
          render={({ field }) => (
            <Input
              id="privacyPolicyUrl"
              type="url"
              autoComplete="off"
              placeholder="https://example.com/privacy-policy"
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
            />
          )}
        />
        <ErrorMessage message={errors.privacyPolicyUrl?.message} />
      </div>

      <div className="form-field">
        <Controller
          control={control}
          name="maintenanceMode"
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <Switch id="maintenanceMode" checked={field.value ?? false} onCheckedChange={field.onChange} />
              <Label htmlFor="maintenanceMode">Maintenance mode</Label>
            </div>
          )}
        />
        <p className="muted-text">
          Non-admin users will see a maintenance page until this is turned off.
        </p>
      </div>

      <Button type="submit" disabled={saveSettings.isPending || !isDirty}>
        {saveSettings.isPending ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  )
}
