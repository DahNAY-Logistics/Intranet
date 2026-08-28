import { Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BannerTab, CategoriesDialog, CreateDialog } from '@/components/banners'
import { useBannersStore } from '@/stores/banners-store'
import { bannerStatuses } from 'core/constants'

export default function AdminBannersPage() {
  const status = useBannersStore((state) => state.status)
  const setStatus = useBannersStore((state) => state.setStatus)
  const setCategoriesOpen = useBannersStore((state) => state.setCategoriesOpen)

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <h1 className="page-heading">Banners</h1>
        <div className="header-actions">
          <Button type="button" variant="outline" onClick={() => setCategoriesOpen(true)}>
            <Tag />
            Categories
          </Button>
          <CreateDialog />
        </div>
      </div>

      <Tabs value={status} onValueChange={(value) => setStatus(value)}>
        <TabsList>
          <TabsTrigger value={bannerStatuses.published}>Published</TabsTrigger>
          <TabsTrigger value={bannerStatuses.archived}>Archived</TabsTrigger>
        </TabsList>
        <TabsContent value={bannerStatuses.published}>
          <BannerTab status={bannerStatuses.published} />
        </TabsContent>
        <TabsContent value={bannerStatuses.archived}>
          <BannerTab status={bannerStatuses.archived} />
        </TabsContent>
      </Tabs>

      <CategoriesDialog />
    </div>
  )
}
