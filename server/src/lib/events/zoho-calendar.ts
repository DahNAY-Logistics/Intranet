import { envMessages } from 'core/messages.ts';

const { ZOHO_CALENDAR_API_URL } = process.env;

if (!ZOHO_CALENDAR_API_URL) {
  throw new Error(envMessages.MISSING_ZOHO_CALENDAR_API_URL);
}

interface ZohoCalendar {
  uid: string;
  isdefault: boolean;
}

export async function getDefaultZohoCalendarUid(accessToken: string): Promise<string> {
  const response = await fetch(`${ZOHO_CALENDAR_API_URL}/calendars`, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Zoho Calendar list request failed with status ${response.status}`);
  }

  const body = (await response.json()) as { calendars: ZohoCalendar[] };
  const calendar = body.calendars.find((entry) => entry.isdefault) ?? body.calendars[0];

  if (!calendar) {
    throw new Error('No Zoho calendars found for this account');
  }

  return calendar.uid;
}

function toZohoEventDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export interface ZohoCalendarEventInput {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
}

export async function createZohoCalendarEvent(accessToken: string, calendarUid: string, event: ZohoCalendarEventInput) {
  const eventdata = JSON.stringify({
    title: event.title,
    description: event.description,
    location: event.location,
    dateandtime: {
      timezone: 'UTC',
      start: toZohoEventDate(event.startDate),
      end: toZohoEventDate(event.endDate),
    },
  });

  const response = await fetch(`${ZOHO_CALENDAR_API_URL}/calendars/${calendarUid}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ eventdata }),
  });

  if (!response.ok) {
    throw new Error(`Zoho Calendar create-event request failed with status ${response.status}`);
  }
}
