export function getInitials(...names: string[]): string {
  return names
    .filter(Boolean)                   // remove undefined / empty
    .join(" ")                         // join into one string
    .trim()
    .split(/\s+/)                      // split by space
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}
