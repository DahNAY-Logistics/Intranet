export interface BlogPostSummary {
  id: string
  slug: string
  title?: string
  feature_image?: string | null
  published_at?: string | null
  excerpt?: string
  custom_excerpt?: string
  reading_time?: number
  url?: string
}

export interface BlogPostDetail extends BlogPostSummary {
  content: string
}

export interface BlogsResponse {
  posts: BlogPostSummary[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface BlogPostResponse {
  post: BlogPostDetail
}
