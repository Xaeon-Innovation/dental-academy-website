import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  type StorageReference,
} from "firebase/storage";
import { app } from "./config";

export const storage = getStorage(app);

export { ref, uploadBytes, getDownloadURL };
export type { StorageReference };
