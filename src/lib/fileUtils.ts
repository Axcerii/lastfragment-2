import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function saveUploadedFile(file: File, folder: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'static', 'uploads', folder);
  
  // Créer le dossier s'il n'existe pas
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  // Générer un nom de fichier unique
  const timestamp = Date.now();
  const extension = path.extname(file.name);
  const filename = `${timestamp}-${Math.random().toString(36).substring(2)}${extension}`;
  const filepath = path.join(uploadsDir, filename);

  // Sauvegarder le fichier
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  // Retourner le chemin relatif pour l'URL
  return `/uploads/${folder}/${filename}`;
}

export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  return validTypes.includes(file.type) && file.size <= maxSize;
}
