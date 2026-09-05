export function tableError(error, fallback) {
  if (error.response?.status === 401) return 'Your session has expired. Please sign in again.'
  if (error.response?.status === 403) return 'You do not have permission to perform this action.'
  if (error.response?.status === 404)
    return 'This table is no longer available. Refresh the list and try again.'
  return error.response?.data?.message || fallback
}
