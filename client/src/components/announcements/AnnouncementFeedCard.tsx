import { format } from 'date-fns'
import { Link } from 'react-router'

import type { AnnouncementResponse } from 'core/types/announcements'

type AnnouncementFeedCardProps = {
  announcement: AnnouncementResponse
}

export default function AnnouncementFeedCard({ announcement }: AnnouncementFeedCardProps) {
  const postedAt = new Date(announcement.createdAt)

  return (
    <article className="bulletin-row">
      <div className="bulletin-date">
        <span className="bulletin-month">{format(postedAt, 'MMM')}</span>
        <span className="bulletin-day">{format(postedAt, 'dd')}</span>
      </div>

      <div className="bulletin-body">
        <span className="home-notice-tag">{announcement.category.name}</span>

        <Link to={`/announcements/${announcement.id}`} className="bulletin-headline">
          {announcement.title}
        </Link>

        <p className="bulletin-excerpt">{announcement.excerpt}</p>

        <p className="bulletin-byline">
          {announcement.postedBy.name} &middot; {format(postedAt, 'yyyy')}
        </p>
      </div>
    </article>
  )
}
