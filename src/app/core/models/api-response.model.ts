export interface ApiResponse<T> {
  response: string;
  data: T | null;
  message: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiPaginatedResponse<T> {
  response: string;
  data: PaginatedData<T> | null;
  message: string;
}
