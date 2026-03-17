export interface ApiResponse<T> {
  success: boolean
  meta: { code: string; message: string }
  data: T
}

export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
  path: string
}

export interface PaginationLinks {
  self: string
  first: string
  last: string
  next: string | null
  prev: string | null
}

export interface Pagination {
  meta: PaginationMeta
  links: PaginationLinks
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination
}
