export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedData<T = unknown> {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  data: T[];
}
