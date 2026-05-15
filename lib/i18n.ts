export function useField(locale: string, thValue: string | null, enValue: string | null) {
  return locale === 'th' ? (thValue || enValue || '') : (enValue || thValue || '')
}
