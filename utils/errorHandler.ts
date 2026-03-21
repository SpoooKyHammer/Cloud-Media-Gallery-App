import { AxiosError } from 'axios';
import type { ApiResponse } from '../types';

/**
 * Extracts error message from Axios error responses.
 * Handles API error response structure:
 * - { success: false, error: { message: string } } - general errors
 * - { success: false, errors: [{ field, message }] } - validation errors
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // Try to get message from API response
    const apiError = error.response?.data as ApiResponse | undefined;
    
    // Single error object (from errorHandler middleware)
    if (apiError?.error?.message) {
      return apiError.error.message;
    }
    
    // Validation errors array (from express-validator)
    if (apiError?.errors && apiError.errors.length > 0) {
      return apiError.errors[0].message;
    }
    
    // Fallback to message field
    if (apiError?.message) {
      return apiError.message;
    }
    
    // Fallback to Axios error message
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};
