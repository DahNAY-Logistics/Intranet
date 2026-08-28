import { DashboardStats, MoodTrendChart } from '@/components/admin/dashboard'

export default function AdminDashboardPage() {
  return (
    <div className="page-stack">
      <h1 className="page-heading">Admin</h1>
      <DashboardStats />
      <MoodTrendChart />
    </div>
  )
}
