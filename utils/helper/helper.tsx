import { getUrl } from "@aws-amplify/storage";

export function getInitials(...names: string[]): string {
  return names
    .filter(Boolean)                   // remove undefined / empty
    .join(" ")                         // join into one string
    .trim()
    .split(/\s+/)                      // split by space
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

  export  const viewDoc = async (s3Key: string) => {
        if (!s3Key) return;
        const result = await getUrl({ path: s3Key });
        window.open(result.url.href, '_blank');
    }
