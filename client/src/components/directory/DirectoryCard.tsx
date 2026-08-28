import { CornerLeftUp, Mail, MapPin } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { initials } from '@/lib/utils'
import type { DirectoryEntry } from 'core/types/directory'

type DirectoryCardProps = {
  entry: DirectoryEntry
}

export default function DirectoryCard({ entry }: DirectoryCardProps) {
  return (
    <article className="roster-row">
      <div className="roster-row-identity">
        <span className="roster-row-ring">
          <Avatar className="size-11">
            <AvatarImage src={entry.image ?? undefined} alt={entry.name} />
            <AvatarFallback>{initials(entry.name)}</AvatarFallback>
          </Avatar>
        </span>

        <div className="roster-row-names">
          <h3 className="roster-row-name">{entry.name}</h3>
          <p className="roster-row-role">{entry.designation?.name ?? 'Unassigned'}</p>
        </div>
      </div>

      <dl className="roster-row-placement">
        <div className="roster-row-fact">
          <dt className="sr-only">Department</dt>
          <dd className="roster-row-dept">{entry.department?.name ?? '—'}</dd>
        </div>

        <div className="roster-row-fact">
          <dt className="sr-only">Location</dt>
          <dd className="roster-row-meta">
            <MapPin aria-hidden="true" className="roster-row-icon" />
            <span className="truncate">{entry.location?.name ?? '—'}</span>
          </dd>
        </div>
      </dl>

      <dl className="roster-row-contact">
        <div className="roster-row-fact">
          <dt className="sr-only">Email</dt>
          <dd className="min-w-0">
            <a href={`mailto:${entry.email}`} className="roster-row-mail">
              <Mail aria-hidden="true" className="roster-row-icon" />
              <span className="truncate">{entry.email}</span>
            </a>
          </dd>
        </div>

        <div className="roster-row-fact">
          <dt className="sr-only">Reports to</dt>
          <dd className="roster-row-meta">
            <CornerLeftUp aria-hidden="true" className="roster-row-icon" />
            <span className="truncate">{entry.reportedTo?.name ?? '—'}</span>
          </dd>
        </div>
      </dl>

      {entry.employeeId && <span className="roster-row-id">{entry.employeeId}</span>}
    </article>
  )
}
