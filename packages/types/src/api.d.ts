export interface ApiResponse<T> {
  success: boolean
  meta: { code: string; message: string }
  data: T
}

export interface Pagination {
  page: number
  page_size: number
  total: number
  total_pages: number
  prev: string | null
  next: string | null
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination
}
