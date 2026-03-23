"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "@/lib/firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { isAdminEmail } from "@/lib/actions/settings";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const adminCheckEmailRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      if (!user?.email) {
        setIsAdmin(false);
        adminCheckEmailRef.current = null;
        return;
      }

      const emailForThisCheck = user.email;
      adminCheckEmailRef.current = emailForThisCheck;
      isAdminEmail(user.email)
        .then((adminStatus) => {
          if (adminCheckEmailRef.current === emailForThisCheck) {
            setIsAdmin(adminStatus);
          }
        })
        .catch(() => {
          if (adminCheckEmailRef.current === emailForThisCheck) {
            setIsAdmin(false);
          }
        });
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setIsAdmin(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
