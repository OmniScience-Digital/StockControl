import { DateTime } from 'luxon';

export function getJhbTimestamp(): string {
  return DateTime.now().setZone('Africa/Johannesburg').toFormat('yyyy-MM-dd HH:mm:ss');
}

export function normalize(str: any): string {
  if (typeof str !== 'string') return String(str);
  return str.trim().replace(/^"+|"+$/g, '');
}