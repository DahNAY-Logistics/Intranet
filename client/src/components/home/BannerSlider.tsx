import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Autoplay from 'embla-carousel-autoplay'

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { BannersResponse } from 'core/types/banners'

export default function BannerSlider() {
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }))
  const [embla, setEmbla] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['banners', 'active'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<BannersResponse>('/banners/active', { signal })
      return data
    },
  })

  useEffect(() => {
    if (!embla) return

    const onSelect = () => setSelected(embla.selectedScrollSnap())

    onSelect()
    embla.on('select', onSelect)

    return () => {
      embla.off('select', onSelect)
    }
  }, [embla])

  if (isLoading) {
    return <div className="sk-block hidden aspect-7/2 w-full rounded-2xl md:block" />
  }

  const banners = data?.banners ?? []

  if (banners.length === 0) {
    return null
  }

  return (
    <div className="banner-slider">
      <Carousel opts={{ loop: true }} plugins={[autoplay.current]} setApi={setEmbla}>
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="banner-frame">
                <img src={banner.attachment.url} alt={banner.title} className="banner-image" />
                <span className="banner-badge">{banner.category.name}</span>
                <div className="banner-copy">
                  <h2 className="banner-title">{banner.title}</h2>
                  <p className="banner-excerpt">{banner.excerpt}</p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="banner-rail">
        <span className="banner-counter">
          {String(selected + 1).padStart(2, '0')} / {String(banners.length).padStart(2, '0')}
        </span>

        <div className="banner-dots">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => embla?.scrollTo(index)}
              className={cn('banner-dot', index === selected && 'banner-dot-active')}
            >
              <span className="sr-only">{banner.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
