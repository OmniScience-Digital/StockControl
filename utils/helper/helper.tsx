
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/) 
    .map(word => word[0].toUpperCase())
    .join('');
}

