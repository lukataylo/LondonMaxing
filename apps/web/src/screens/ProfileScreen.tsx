import { useEffect, useMemo, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  Camera as CameraRaw,
  Check as CheckRaw,
  Footprints as FootprintsRaw,
  Image as ImageRaw,
  MapPin as MapPinRaw,
  ShieldCheck as ShieldCheckRaw,
  Sparkles as SparklesRaw,
  UserRound as UserRoundRaw,
} from "lucide-react";
import { TOURS, getCharacter, type Memory } from "@grudgemap/shared";
import type { User } from "../auth";

const MEMORY_KEY = "grudgemap.memories.v1";
const TRACKING_KEY = "grudgemap.trackingOptIn.v1";
const SEEN_TOURS_KEY = "grudgemap.seenTours.v1";
type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const Camera = CameraRaw as unknown as IconComponent;
const Check = CheckRaw as unknown as IconComponent;
const Footprints = FootprintsRaw as unknown as IconComponent;
const Image = ImageRaw as unknown as IconComponent;
const MapPin = MapPinRaw as unknown as IconComponent;
const ShieldCheck = ShieldCheckRaw as unknown as IconComponent;
const Sparkles = SparklesRaw as unknown as IconComponent;
const UserRound = UserRoundRaw as unknown as IconComponent;

type ProfileScreenProps = {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onUseGuest: () => void;
  onUpdateUser: (patch: Partial<User>) => void;
};

function readMemories(): Memory[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as Memory[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readSeenTours(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_TOURS_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function readTrackingOptIn(): boolean {
  try {
    return localStorage.getItem(TRACKING_KEY) === "true";
  } catch {
    return false;
  }
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function ProfileScreen({ user, onSignIn, onSignOut, onUpdateUser, onUseGuest }: ProfileScreenProps) {
  const [trackingOptIn, setTrackingOptIn] = useState(() => readTrackingOptIn());
  const [memories, setMemories] = useState<Memory[]>(() => readMemories());
  const [seenTours, setSeenTours] = useState<string[]>(() => readSeenTours());

  useEffect(() => {
    localStorage.setItem(TRACKING_KEY, String(trackingOptIn));
  }, [trackingOptIn]);

  useEffect(() => {
    const refresh = () => {
      setMemories(readMemories());
      setSeenTours(readSeenTours());
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const summary = useMemo(() => {
    const placeIds = unique(memories.map((memory) => memory.spotId));
    return {
      stickers: memories.length,
      places: placeIds.length,
      placeNames: placeIds
        .map((id) => getCharacter(id)?.name)
        .filter((name): name is string => Boolean(name))
        .slice(0, 4),
      tours: seenTours.length,
      tourNames: seenTours
        .map((id) => TOURS.find((tour) => tour.id === id)?.title)
        .filter((title): title is string => Boolean(title))
        .slice(0, 3),
    };
  }, [memories, seenTours]);

  function handlePhoto(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onUpdateUser({ photoUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  }

  const displayName = user?.guest ? "Guest" : user?.email ?? "Guest";
  const signedIn = Boolean(user && !user.guest);

  return (
    <main className="shell-screen profile-screen">
      <section className="shell-panel profile-panel" aria-labelledby="profile-title">
        <div className="profile-header">
          <label className="profile-avatar">
            {user?.photoUrl ? <img src={user.photoUrl} alt="" /> : <UserRound size={36} />}
            <span className="avatar-action" aria-hidden="true">
              <Camera size={15} />
            </span>
            <input type="file" accept="image/*" onChange={(event) => handlePhoto(event.target.files?.[0] ?? null)} />
          </label>

          <div className="shell-heading profile-title">
            <span className="shell-kicker">
              <ShieldCheck size={16} />
              Profile
            </span>
            <h1 id="profile-title">{displayName}</h1>
            <p>{signedIn ? "Signed in with magic link." : "Browsing as a guest."}</p>
          </div>
        </div>

        <div className="profile-actions">
          {signedIn ? (
            <button type="button" className="secondary-shell-button" onClick={onSignOut}>
              Sign out
            </button>
          ) : (
            <>
              <button type="button" className="primary-shell-button" onClick={onSignIn}>
                Sign in
              </button>
              {!user ? (
                <button type="button" className="secondary-shell-button" onClick={onUseGuest}>
                  Continue as guest
                </button>
              ) : null}
            </>
          )}
        </div>

        <section className="tracking-box" aria-labelledby="tracking-title">
          <div>
            <h2 id="tracking-title">Location tracking</h2>
            <p>
              Save my opt-in preference for future location features. Old Haunts does not run background tracking from
              this toggle.
            </p>
          </div>
          <button
            type="button"
            className={`toggle-switch ${trackingOptIn ? "is-on" : ""}`}
            onClick={() => setTrackingOptIn((value) => !value)}
            aria-pressed={trackingOptIn}
          >
            <span>{trackingOptIn ? <Check size={14} /> : null}</span>
          </button>
        </section>

        <section className="summary-grid" aria-label="Local activity summary">
          <article>
            <Image size={19} />
            <strong>{summary.stickers}</strong>
            <span>stickers</span>
          </article>
          <article>
            <MapPin size={19} />
            <strong>{summary.places}</strong>
            <span>places</span>
          </article>
          <article>
            <Footprints size={19} />
            <strong>{summary.tours}</strong>
            <span>tours</span>
          </article>
        </section>

        <section className="profile-list" aria-labelledby="local-summary-title">
          <h2 id="local-summary-title">Local summary</h2>
          <p>
            {summary.placeNames.length
              ? `Places seen: ${summary.placeNames.join(", ")}.`
              : "No saved places in this browser yet."}
          </p>
          <p>
            {summary.tourNames.length
              ? `Tours seen: ${summary.tourNames.join(", ")}.`
              : "Start a guided walk from a map story to add tours here."}
          </p>
          <p className="profile-note">
            <Sparkles size={15} />
            Profile picture, tracking opt-in, and saved memories stay on this device.
          </p>
        </section>
      </section>
    </main>
  );
}
