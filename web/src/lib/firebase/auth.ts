import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
} from "firebase/auth";
import { app } from "./config";

export const auth = getAuth(app);

export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged };
export type { User, UserCredential };
