import { useEffect, useState } from 'react';
import { loadPhoto } from './photos';

/** Loads a stored photo as an object URL and frees it when the component goes away. */
export function usePhotoUrl(id: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    let made: string | null = null;
    void loadPhoto(id).then((blob) => {
      if (!alive || !blob) return;
      made = URL.createObjectURL(blob);
      setUrl(made);
    });
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [id]);
  return url;
}
