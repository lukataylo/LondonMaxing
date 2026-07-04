// Lightweight client-side auth for the demo (no backend account system).
// Session persists in localStorage. Sub-agents may enhance the Login UI but
// should keep this hook's shape stable — AppShell depends on it.
import { useCallback, useState } from "react";

export type User = {
  email: string;
  guest?: boolean;
  photoUrl?: string;
};

const KEY = "grudgemap.user.v1";

export function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => loadUser());

  const signIn = useCallback((u: User) => {
    localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(KEY);
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { user, signIn, signOut, updateUser };
}
