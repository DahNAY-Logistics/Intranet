export interface SettingsResponse {
  siteName: string
  organizationName: string
  supportEmail: string
  codeOfConductUrl: string | null
  privacyPolicyUrl: string | null
  maintenanceMode: boolean
}
