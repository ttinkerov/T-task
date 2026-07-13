export interface ApiResponseMeta {
  total?: number;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: ApiResponseMeta;
}

export function successResponse<T>(data: T, meta?: ApiResponseMeta): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    ...(meta ? { meta } : {}),
  };
}

export function errorResponse(message: string): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: message,
  };
}
