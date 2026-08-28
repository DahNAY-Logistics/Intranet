export const commonMessages = {
  ACCESS_DENIED: 'Access denied. Contact your administrator if you believe this is a mistake.',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
  VALIDATION_FAILED: 'Validation failed',
  INVALID_QUERY: 'Invalid query parameters',
  INVALID_BODY: 'Invalid request body',
  SIGNIN_UNREACHABLE: 'Could not reach the sign-in service. Please try again.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Try again, or contact your administrator if the problem continues.',
  API_DISCONNECTED: (reason: string) => `Not connected — ${reason}. Is the server running on port 3000?`,
} as const

export const userMessages = {
  // validation
  DUPLICATE_FIELD: 'User with this email or employee ID already exists.',
  EMAIL_DOMAIN_NOT_ALLOWED: 'Email must be within the allowed company domain',
  CANNOT_REPORT_TO_SELF: 'A user cannot be their own Reported To.',
  CANNOT_REPORT_TO_OWN_DESCENDANT: 'This assignment would create a reporting cycle.',
  INVALID_REPORTED_TO: 'Reported To must be an existing user.',

  // success
  CREATED: (name: string) => `${name} added successfully`,
  UPDATED: (name: string) => `${name} updated successfully`,
  DEACTIVATED: (count: number) => `${count} user${count === 1 ? '' : 's'} deactivated successfully`,
  REACTIVATED: (count: number) => `${count} user${count === 1 ? '' : 's'} reactivated successfully`,

  // failure
  NOT_FOUND: 'User not found',
  CANNOT_DEACTIVATE_ADMIN: (names: string[]) => `Admin users cannot be deactivated: ${names.join(', ')}`,
  LAST_ADMIN: 'At least one admin is required. Promote another user to Admin first.',
} as const

export const categoryMessages = {
  // validation
  DUPLICATE_NAME: (entity: string) => `A ${entity.toLowerCase()} with this name already exists.`,
  INVALID_BODY: 'Invalid request body',
  INVALID_PARAMS: 'Invalid request parameters',

  // success
  CREATED: (entity: string, name: string) => `${entity} "${name}" created`,
  UPDATED: (entity: string, name: string) => `${entity} "${name}" renamed`,
  DELETED: (entity: string, name: string) => `${entity} "${name}" deleted`,

  // failure
  NOT_FOUND: (entity: string) => `${entity} not found`,
  IN_USE: (entity: string, count: number, resource: string) =>
    `Cannot delete ${entity.toLowerCase()}: ${count} ${resource}${count === 1 ? '' : 's'} still use it.`,
} as const

export const announcementMessages = {
  // validation
  INVALID_BODY: 'Invalid request body',
  INVALID_PARAMS: 'Invalid request parameters',
  INVALID_QUERY: 'Invalid query parameters',

  // success
  CREATED: (title: string) => `"${title}" created successfully`,
  UPDATED: (title: string) => `"${title}" updated successfully`,
  DELETED: (title: string) => `"${title}" deleted successfully`,

  // failure
  NOT_FOUND: 'Announcement not found',
} as const

export const bannerMessages = {
  // validation
  INVALID_BODY: 'Invalid request body',
  INVALID_PARAMS: 'Invalid request parameters',
  INVALID_QUERY: 'Invalid query parameters',
  INVALID_REORDER_BODY: 'Invalid request body for reordering banners',
  ATTACHMENT_NOT_FOUND: 'Attachment not found',
  ATTACHMENT_ALREADY_USED: 'This attachment is already linked to another banner.',
  INVALID_IMAGE_TYPE: 'Only JPEG, PNG, or WebP images are allowed.',
  IMAGE_TOO_LARGE: 'Image exceeds the maximum upload size.',
  IMAGE_UNREADABLE: 'Could not read this file as an image.',
  IMAGE_DIMENSIONS_INVALID: (minWidthPx: number) => `Image must be at least ${minWidthPx}px wide.`,
  IMAGE_ASPECT_RATIO_INVALID: 'Image must be landscape (wider than it is tall) to fit the homepage slider.',

  // success
  CREATED: (title: string) => `"${title}" created successfully`,
  UPDATED: (title: string) => `"${title}" updated successfully`,
  DELETED: (title: string) => `"${title}" deleted successfully`,
  REORDERED: 'Banners reordered successfully',

  // failure
  NOT_FOUND: 'Banner not found',
  REORDER_STATUS_MISMATCH: 'Reorder rejected: one or more banners are not currently Published.',
} as const

export const eventMessages = {
  // validation
  INVALID_BODY: 'Invalid request body',
  INVALID_PARAMS: 'Invalid request parameters',
  INVALID_QUERY: 'Invalid query parameters',

  // success
  CREATED: (title: string) => `"${title}" created successfully`,
  UPDATED: (title: string) => `"${title}" updated successfully`,
  DELETED: (title: string) => `"${title}" deleted successfully`,
  ADDED_TO_CALENDAR: (title: string) => `"${title}" added to your Zoho Calendar`,

  // failure
  NOT_FOUND: 'Event not found',
  ENDED: 'This event has already ended',
  ZOHO_CALENDAR_NOT_CONNECTED: 'Connect your Zoho Calendar to add this event',
} as const

export const quickLinkMessages = {
  // validation
  INVALID_BODY: 'Invalid request body',
  INVALID_PARAMS: 'Invalid request parameters',
  INVALID_QUERY: 'Invalid query parameters',

  // success
  CREATED: (title: string) => `"${title}" created successfully`,
  UPDATED: (title: string) => `"${title}" updated successfully`,
  DELETED: (title: string) => `"${title}" deleted successfully`,

  // failure
  NOT_FOUND: 'Quick link not found',
} as const

export const resourceMessages = {
  // validation
  INVALID_BODY: 'Invalid request body',
  INVALID_PARAMS: 'Invalid request parameters',
  INVALID_QUERY: 'Invalid query parameters',

  // success
  CREATED: (title: string) => `"${title}" created successfully`,
  UPDATED: (title: string) => `"${title}" updated successfully`,
  DELETED: (title: string) => `"${title}" deleted successfully`,

  // failure
  NOT_FOUND: 'Resource not found',
} as const

export const settingsMessages = {
  // validation
  INVALID_BODY: 'Invalid request body',

  // success
  UPDATED: 'Settings updated successfully',
} as const

export const blogMessages = {
  // validation
  INVALID_QUERY: 'Invalid query parameters',
  INVALID_PARAMS: 'Invalid request parameters',

  // failure
  NOT_FOUND: 'Blog post not found',
  NOT_CONFIGURED: 'Blogs are not configured on this server.',
  UPSTREAM_UNAVAILABLE: 'Could not reach the blog service. Please try again later.',
} as const

export const dashboardMessages = {
  // validation
  INVALID_QUERY: 'Invalid query parameters',
} as const

export const moodMessages = {
  // validation
  INVALID_BODY: 'Invalid request body',

  // success
  CHECKED_IN: 'Thanks for checking in!',

  // failure
  ALREADY_CHECKED_IN: 'You have already checked in today.',
} as const

export const envMessages = {
  // env variables
  MISSING_DATABASE_URL: 'DATABASE_URL is not defined in the environment variables',
  MISSING_CLIENT_URL: 'CLIENT_URL is not defined in the environment variables',
  MISSING_BETTER_AUTH_ENV: 'Missing one or more Better Auth environment variables',
  MISSING_ZOHO_ENV: 'Missing one or more Zoho environment variables',
  MISSING_ALLOWED_EMAIL_DOMAIN: 'ALLOWED_EMAIL_DOMAIN is not defined in the environment variables',
  MISSING_ZOHO_CALENDAR_API_URL: 'ZOHO_CALENDAR_API_URL is not defined in the environment variables',
  MISSING_BLOB_STORAGE_ENV: 'Missing one or more Blob Storage environment variables',
  MISSING_GHOST_ENV: 'Missing one or more Ghost CMS environment variables',

  // seed env variables
  MISSING_SEED_ENV_VARIABLES: 'One or more seed environment variables are not defined',
} as const

export const serverMessages = {
  LISTENING: (port: number | string) => `Listening on http://localhost:${port}`,
  SHUTTING_DOWN: (signal: string) => `Received ${signal} — shutting down`,
} as const

export const seedMessages = {
  EMAIL_OUTSIDE_ALLOWED_DOMAIN: 'Email is outside ALLOWED_EMAIL_DOMAIN',
  ADMIN_ALREADY_EXISTS: (email: string) => `Admin user ${email} already exists — skipping.`,
  ADMIN_CREATED: (email: string) => `Admin user ${email} created successfully.`,
  ADMIN_CREATION_FAILED: 'Error seeding admin user:',
  BANNER_ALREADY_EXISTS: (title: string) => `Banner "${title}" already exists — skipping.`,
  BANNERS_SEEDED: (count: number) => `Seeded ${count} banner(s).`,
  BANNERS_SEED_FAILED: 'Error seeding banners:',
} as const
