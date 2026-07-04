// Top-level shell: drops the user STRAIGHT into the map (App) — no login gate.
// Sign-up is OPTIONAL: a small "Sign in" affordance opens the magic-link screen
// on demand; until then the user explores anonymously.
import {
  Images as ImagesRaw,
  Map as MapRaw,
  Search as SearchRaw,
  UserRound as UserRoundRaw,
  UsersRound as UsersRoundRaw,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuth, type User } from "./auth";
import { Login } from "./screens/Login";
import { MemoriesScreen } from "./screens/MemoriesScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { SocialScreen } from "./screens/SocialScreen";
import { App } from "./App";

const SOCIAL_ENABLED = import.meta.env.VITE_ENABLE_SOCIAL === "true";

type AppRoute = "map" | "search" | "memories" | "profile" | "social";
type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const Images = ImagesRaw as unknown as IconComponent;
const Map = MapRaw as unknown as IconComponent;
const Search = SearchRaw as unknown as IconComponent;
const UserRound = UserRoundRaw as unknown as IconComponent;
const UsersRound = UsersRoundRaw as unknown as IconComponent;

function routeFromHash(): AppRoute {
  if (typeof window === "undefined") return "map";
  const value = window.location.hash.replace(/^#\/?/, "");
  if (value === "search" || value === "memories" || value === "profile") return value;
  if (value === "social" && SOCIAL_ENABLED) return value;
  return "map";
}

export function AppShell() {
  const { user, signIn, signOut, updateUser } = useAuth();
  const [route, setRoute] = useState<AppRoute>(() => routeFromHash());
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const syncRoute = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", syncRoute);
    window.addEventListener("popstate", syncRoute);
    return () => {
      window.removeEventListener("hashchange", syncRoute);
      window.removeEventListener("popstate", syncRoute);
    };
  }, []);

  const routes = useMemo(
    () => [
      { id: "map" as const, label: "Map", icon: <Map size={18} /> },
      { id: "search" as const, label: "Search", icon: <Search size={18} /> },
      { id: "memories" as const, label: "Memories", icon: <Images size={18} /> },
      { id: "profile" as const, label: "Profile", icon: <UserRound size={18} /> },
      ...(SOCIAL_ENABLED ? [{ id: "social" as const, label: "Social", icon: <UsersRound size={18} /> }] : []),
    ],
    []
  );

  function navigate(next: AppRoute) {
    if (next === "social" && !SOCIAL_ENABLED) return;
    setRoute(next);
    if (typeof window !== "undefined") {
      const hash = next === "map" ? "" : `#/${next}`;
      if (window.location.hash !== hash) {
        window.history.pushState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
      }
    }
  }

  // Optional auth screen — only shown if the user chooses to sign in.
  if (showLogin && (!user || user.guest)) {
    return (
      <Login
        onAuthed={(u: User) => {
          signIn(u);
          setShowLogin(false);
        }}
        onBack={() => setShowLogin(false)}
      />
    );
  }

  const account = {
    signedIn: Boolean(user && !user.guest),
    email: user?.email,
    onSignIn: () => setShowLogin(true),
    onSignOut: signOut,
  };

  return (
    <>
      {route === "map" ? <App account={account} /> : null}
      {route === "search" ? <SearchScreen /> : null}
      {route === "memories" ? <MemoriesScreen /> : null}
      {route === "profile" ? (
        <ProfileScreen
          user={user}
          onSignIn={() => setShowLogin(true)}
          onSignOut={signOut}
          onUseGuest={() => signIn({ email: "Guest", guest: true })}
          onUpdateUser={updateUser}
        />
      ) : null}
      {route === "social" && SOCIAL_ENABLED ? <SocialScreen /> : null}

      <nav className="near-route-nav" aria-label="Primary">
        {routes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={route === item.id ? "is-active" : ""}
            onClick={() => navigate(item.id)}
            aria-current={route === item.id ? "page" : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
