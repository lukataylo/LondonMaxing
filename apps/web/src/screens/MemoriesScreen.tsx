import { useMemo, useRef, useState, type ChangeEvent, type ComponentType, type SVGProps } from "react";
import {
  CalendarDays as CalendarDaysRaw,
  Camera as CameraRaw,
  ChevronRight as ChevronRightRaw,
  Images as ImagesRaw,
  MapPin as MapPinRaw,
} from "lucide-react";
import type { Memory } from "@grudgemap/shared";
import { getCharacter } from "@grudgemap/shared";
import { makeStickerFromPhoto } from "../sticker";

const MEMORY_KEY = "grudgemap.memories.v1";
type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const CalendarDays = CalendarDaysRaw as unknown as IconComponent;
const Camera = CameraRaw as unknown as IconComponent;
const ChevronRight = ChevronRightRaw as unknown as IconComponent;
const Images = ImagesRaw as unknown as IconComponent;
const MapPin = MapPinRaw as unknown as IconComponent;

type DayGroup = {
  day: string;
  memories: Memory[];
};

const SAMPLE_MEMORIES: Memory[] = [
  makeSampleMemory("sample-westminster-books", "2026-06-13", "westminster-books", "/pins/places/bookshop.png", "Westminster Books", 51.501, -0.126, 5),
  makeSampleMemory("sample-big-ben", "2026-06-13", "big-ben", "/pins/places/big-ben.png", "Big Ben", 51.5007, -0.1246, 4),
  makeSampleMemory("sample-portobello", "2026-06-13", "portobello-road", "/pins/places/plaque.png", "Portobello Road", 51.5154, -0.2057, 3),
  makeSampleMemory("sample-coffee", "2026-06-13", "notting-hill-coffee", "/pins/places/coffee.png", "Notting Hill Coffee", 51.515, -0.201, 2),
  makeSampleMemory("sample-postbox", "2026-06-13", "objects/pillar-box", "/pins/objects/pillar-box.png", "Royal Mail Box", 51.5085, -0.128, 1),
  makeSampleMemory("sample-sky-garden", "2026-06-12", "landmarks/sky-garden", "/pins/landmarks/sky-garden.png", "Sky Garden", 51.5113, -0.0835, 28),
  makeSampleMemory("sample-st-pauls", "2026-06-12", "buildings/st-pauls-cathedral", "/pins/buildings/st-pauls-cathedral.png", "St. Paul's Cathedral", 51.5138, -0.0984, 27),
  makeSampleMemory("sample-black-cab", "2026-06-12", "objects/black-cab", "/pins/objects/black-cab.png", "Black Cab", 51.508, -0.1248, 26),
  makeSampleMemory("sample-columbia", "2026-06-12", "columbia-road-market", "/pins/places/coffee.png", "Columbia Road Market", 51.5296, -0.0716, 25),
  makeSampleMemory("sample-tower-bridge", "2026-06-11", "landmarks/tower-bridge", "/pins/landmarks/tower-bridge.png", "Tower Bridge", 51.5055, -0.0754, 52),
  makeSampleMemory("sample-london-eye", "2026-06-11", "london-eye", "/pins/places/monument.png", "London Eye", 51.5033, -0.1195, 51),
  makeSampleMemory("sample-baker-street", "2026-06-11", "baker-street", "/pins/places/plaque.png", "Baker Street", 51.5237, -0.1585, 50),
  makeSampleMemory("sample-charing-books", "2026-06-11", "charing-cross-books", "/pins/places/bookshop.png", "Charing Cross Books", 51.508, -0.125, 49),
  makeSampleMemory("sample-buckingham", "2026-06-11", "buckingham-palace", "/pins/places/buckingham-palace.png", "Buckingham Palace", 51.5014, -0.1419, 48),
];

function makeSampleMemory(
  id: string,
  day: string,
  spotId: string,
  stickerUrl: string,
  caption: string,
  lat: number,
  lng: number,
  hoursAgo: number,
): Memory {
  return {
    id,
    day,
    spotId,
    photoUrl: stickerUrl,
    stickerUrl,
    caption,
    lat,
    lng,
    createdAt: Date.now() - hoursAgo * 3_600_000,
  };
}

function readMemories(): Memory[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as Memory[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistMemories(memories: Memory[]) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
}

function visibleMemories(memories: Memory[]) {
  const sampleIds = new Set(memories.map((memory) => memory.id));
  return [...memories, ...SAMPLE_MEMORIES.filter((memory) => !sampleIds.has(memory.id))];
}

function groupByDay(memories: Memory[]): DayGroup[] {
  const groups = new Map<string, Memory[]>();
  for (const memory of memories) {
    const day = memory.day || new Date(memory.createdAt).toISOString().slice(0, 10);
    groups.set(day, [...(groups.get(day) ?? []), memory]);
  }
  return Array.from(groups.entries())
    .map(([day, items]) => ({
      day,
      memories: items.sort((a, b) => b.createdAt - a.createdAt),
    }))
    .sort((a, b) => b.day.localeCompare(a.day));
}

function formatDay(day: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${day}T12:00:00`));
}

function memoryTitle(memory: Memory) {
  const character = getCharacter(memory.spotId);
  return memory.caption || character?.name || "Saved sticker";
}

function memoryKind(memory: Memory) {
  if (memory.photoUrl.startsWith("data:")) return "New photo memory";
  if (memory.spotId.includes("objects/") || memory.caption?.toLowerCase().includes("box")) return "Sticker found";
  return "Favorite detail captured";
}

function locationLine(memory: Memory) {
  return `${memory.lat.toFixed(4)}, ${memory.lng.toFixed(4)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read photo"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 51.5074, lng: -0.1278 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (fix) => resolve({ lat: fix.coords.latitude, lng: fix.coords.longitude }),
      () => resolve({ lat: 51.5074, lng: -0.1278 }),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 4_000 },
    );
  });
}

export function MemoriesScreen() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [storedMemories, setStoredMemories] = useState<Memory[]>(() => readMemories());
  const [isProcessing, setIsProcessing] = useState(false);
  const memories = useMemo(() => visibleMemories(storedMemories), [storedMemories]);
  const groups = useMemo(() => groupByDay(memories), [memories]);

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsProcessing(true);
    try {
      const [photoUrl, position] = await Promise.all([readFileAsDataUrl(file), getCurrentPosition()]);
      const label = "New memory";
      const stickerUrl = await makeStickerFromPhoto(photoUrl, label);
      const memory: Memory = {
        id: crypto.randomUUID(),
        day: todayKey(),
        spotId: "captured/current-location",
        photoUrl,
        stickerUrl,
        caption: label,
        lat: position.lat,
        lng: position.lng,
        createdAt: Date.now(),
      };
      const nextMemories = [memory, ...storedMemories];
      persistMemories(nextMemories);
      setStoredMemories(nextMemories);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <main className="shell-screen memories-screen">
      <section className="memories-panel" aria-labelledby="memories-title">
        <header className="memories-hero">
          <div>
            <span className="shell-kicker">
              <Images size={16} />
              Memories
            </span>
            <h1 id="memories-title">Your London sticker diary.</h1>
            <p>Daily captures become shareable sticker packs from the places you actually found.</p>
          </div>
          <button
            className="memory-add-button"
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isProcessing}
          >
            <Camera size={18} />
            {isProcessing ? "Making sticker" : "New memory"}
          </button>
          <input
            ref={fileRef}
            className="memory-file-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
          />
        </header>

        <div className="memory-days">
          {groups.map((group) => (
            <section className="memory-day-row" key={group.day} aria-label={formatDay(group.day)}>
              <header className="memory-day-row-head">
                <div>
                  <span>
                    <CalendarDays size={17} />
                    {formatDay(group.day)}
                  </span>
                </div>
                <button type="button" aria-label={`Open ${formatDay(group.day)} memories`}>
                  <ChevronRight size={20} />
                </button>
              </header>
              <div className="memory-strip" role="list">
                {group.memories.map((memory) => (
                  <article className="memory-strip-item" key={memory.id} role="listitem">
                    <div className="memory-strip-art">
                      <img src={memory.stickerUrl} alt={memoryTitle(memory)} />
                    </div>
                    <h2>{memoryTitle(memory)}</h2>
                    <p>{memoryKind(memory)}</p>
                    <span>
                      <MapPin size={12} />
                      {locationLine(memory)}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
