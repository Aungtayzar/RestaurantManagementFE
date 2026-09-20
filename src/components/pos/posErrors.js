export function posError(error, fallback) {
  if (error.response?.status === 401) return 'Your session has expired. Please sign in again.'
  if (error.response?.status === 403) return 'You do not have permission to perform this action.'
  const errors = error.response?.data?.errors
  if (errors) return Object.values(errors).flat()[0] ?? fallback
  return error.response?.data?.message || fallback
}
