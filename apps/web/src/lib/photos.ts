import localforage from 'localforage';

// Photos of paper journal pages live in their own database, on this device only.
const db = localforage.createInstance({ name: 'life-quest-photos', storeName: 'photos' });
const MAX_SIDE = 1600;

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Shrinks a photo to at most 1600 px on the long side as a JPEG, falling back to the original file. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.8));
    return blob ?? file;
  } catch {
    return file;
  }
}

export async function savePhoto(file: File): Promise<string> {
  const id = newId();
  await db.setItem(id, await shrink(file));
  return id;
}

export const loadPhoto = (id: string): Promise<Blob | null> => db.getItem<Blob>(id);

export async function deletePhoto(id: string): Promise<void> {
  await db.removeItem(id);
}

export async function clearPhotos(): Promise<void> {
  await db.clear();
}
