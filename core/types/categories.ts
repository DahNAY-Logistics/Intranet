import type { CategoryListItem } from '../schemas/categories.ts'

export type { CategoryListItem }

export interface CategoriesResponse {
  categories: CategoryListItem[]
}

export interface CategoryDeletedResponse {
  deletedId: number
}
