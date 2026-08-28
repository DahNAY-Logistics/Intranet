import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Link2 } from 'lucide-react'

import { EmptyState } from '@/components/shared'
import { api } from '@/lib/api'
import type { QuickLinksActiveResponse } from 'core/types/quick-links'

const SKELETON_COUNT = 6

export default function QuickLinksWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['quick-links', 'active'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<QuickLinksActiveResponse>('/quick-links/active', { signal })
      return data
    },
  })

  const quickLinks = data?.quickLinks ?? []

  return (
    <section className="home-index">
      <div className="home-index-head">
        <div className="home-section-head">
          <span className="home-icon-chip">
            <Link2 className="size-4" />
          </span>
          <div>
            <p className="home-eyebrow">Shortcuts</p>
            <h2 className="home-section-title">Quick links</h2>
          </div>
        </div>

        {quickLinks.length > 0 && (
          <p className="home-index-count">{String(quickLinks.length).padStart(2, '0')} entries</p>
        )}
      </div>

      {isLoading ? (
        <div className="home-index-list">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 py-3">
              <span className="sk-line w-5" />
              <span className="sk-line w-40" />
              <span className="sk-line flex-1" />
              <span className="sk-line w-16" />
            </div>
          ))}
        </div>
      ) : quickLinks.length === 0 ? (
        <EmptyState icon={Link2} message="No quick links yet." tone="home" compact />
      ) : (
        <div className="home-index-list">
          {quickLinks.map((quickLink, index) => (
            <a
              key={quickLink.id}
              href={quickLink.url}
              target="_blank"
              rel="noreferrer"
              className="home-index-row group"
            >
              <span className="home-index-number">{String(index + 1).padStart(2, '0')}</span>

              <span className="home-index-body">
                <span className="home-index-line">
                  <span className="home-index-title">{quickLink.title}</span>
                  <span aria-hidden="true" className="home-index-leader" />
                  <span className="home-index-tag">{quickLink.category.name}</span>
                  <ArrowUpRight className="home-index-arrow" />
                </span>

                <span className="home-index-excerpt">{quickLink.excerpt}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
