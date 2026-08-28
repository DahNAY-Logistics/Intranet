import axios from 'axios'

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error ?? fallback
  }

  return fallback
}
