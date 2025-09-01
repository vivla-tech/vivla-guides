import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener instancia de Storage
export const storage = getStorage(app);

// Función para subir archivos
export const uploadFile = async (file: File, path: string): Promise<string> => {
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  
  const storageRef = ref(storage, path);

  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error durante la subida:', error);
    throw error;
  }
};

// Función para subir múltiples archivos
export const uploadMultipleFiles = async (files: File[], basePath: string): Promise<string[]> => {
  const urls: string[] = [];
  
  for (const file of files) {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const path = `${basePath}/${fileName}`;
    
    const url = await uploadFile(file, path);
    urls.push(url);
  }
  
  return urls;
};

// Función para eliminar un archivo del storage
export const deleteFile = async (url: string): Promise<void> => {
  const { ref, deleteObject } = await import('firebase/storage');
  
  try {
    
    // Extraer la ruta del archivo desde la URL
    const urlObj = new URL(url);
    
    // Intentar diferentes patrones para extraer la ruta
    let filePath: string | null = null;
    
    // Patrón 1: /o/encoded-path?alt=media&token=...
    const pattern1 = urlObj.pathname.match(/\/o\/(.+?)\?/);
    if (pattern1) {
      filePath = decodeURIComponent(pattern1[1]);
    }
    
    // Patrón 2: /o/encoded-path
    if (!filePath) {
      const pattern2 = urlObj.pathname.match(/\/o\/(.+)/);
      if (pattern2) {
        filePath = decodeURIComponent(pattern2[1]);
      }
    }
    
    // Patrón 3: Si no funciona, intentar extraer directamente del pathname
    if (!filePath) {
      // Remover el bucket name del pathname
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === 'o');
      if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
        filePath = pathParts.slice(bucketIndex + 1).join('/');
        filePath = decodeURIComponent(filePath);
      }
    }
    
    if (!filePath) {
      console.error('No se pudo extraer la ruta. URL completa:', url);
      throw new Error('No se pudo extraer la ruta del archivo desde la URL');
    }
    
    
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    throw error;
  }
};

// Función para eliminar múltiples archivos del storage
export const deleteMultipleFiles = async (urls: string[]): Promise<void> => {
  const deletePromises = urls.map(url => deleteFile(url));
  await Promise.all(deletePromises);
};
