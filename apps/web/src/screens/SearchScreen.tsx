import { useMemo, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  ChevronRight as ChevronRightRaw,
  Clock as ClockRaw,
  Footprints as FootprintsRaw,
  MapPin as MapPinRaw,
  Search as SearchRaw,
  Sparkles as SparklesRaw,
  UserRound as UserRoundRaw,
} from "lucide-react";
import { CHARACTER_SPOTS, TOURS, getCharacter, type Memory } from "@grudgemap/shared";

const MEMORY_KEY = "grudgemap.memories.v1";
type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const ChevronRight = ChevronRightRaw as unknown as IconComponent;
const Clock = ClockRaw as unknown as IconComponent;
const Footprints = FootprintsRaw as unknown as IconComponent;
const MapPin = MapPinRaw as unknown as IconComponent;
const Search = SearchRaw as unknown as IconComponent;
const Sparkles = SparklesRaw as unknown as IconComponent;
const UserRound = UserRoundRaw as unknown as IconComponent;

type SearchKind = "all" | "people" | "places" | "tours" | "memories";

type SearchItem = {
  id: string;
  kind: Exclude<SearchKind, "all">;
  title: string;
  meta: string;
  description: string;
  targetUrl: string;
};

const FILTERS: Array<{ id: SearchKind; label: string }> = [
  { id: "all", label: "All" },
  { id: "people", label: "People" },
  { id: "places", label: "Places" },
  { id: "tours", label: "Tours" },
  { id: "memories", label: "Memories" },
];

function readMemories(): Memory[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as Memory[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function placeLabel(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function kindIcon(kind: SearchItem["kind"]) {
  if (kind === "people") return <UserRound size={18} />;
  if (kind === "places") return <MapPin size={18} />;
  if (kind === "tours") return <Footprints size={18} />;
  return <Sparkles size={18} />;
}

export function SearchScreen() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchKind>("all");
  const memories = useMemo(() => readMemories(), []);

  const items = useMemo<SearchItem[]>(() => {
    const people = CHARACTER_SPOTS.map((spot) => {
      const character = getCharacter(spot.id);
      return {
        id: `person-${spot.id}`,
        kind: "people" as const,
        title: character?.name ?? spot.title,
        meta: character ? `${character.era} / ${character.category}` : "Map person",
        description: character?.blurb ?? spot.seed ?? "Available on the map.",
        targetUrl: `/?spot=${encodeURIComponent(spot.id)}`,
      };
    });

    const places = CHARACTER_SPOTS.map((spot) => {
      const character = getCharacter(spot.id);
      return {
        id: `place-${spot.id}`,
        kind: "places" as const,
        title: `${character?.name ?? spot.title} location`,
        meta: placeLabel(spot.lat, spot.lng),
        description: `Unlock radius ${spot.unlockRadius}m. ${character?.blurb ?? "Open this from the map."}`,
        targetUrl: `/?spot=${encodeURIComponent(spot.id)}`,
      };
    });

    const tours = TOURS.map((tour) => ({
      id: `tour-${tour.id}`,
      kind: "tours" as const,
      title: tour.title,
      meta: `${tour.guideName} / ${tour.durationMin} min / ${tour.stops.length} stops`,
      description: tour.summary,
      targetUrl: `/?spot=${encodeURIComponent(tour.guideId)}`,
    }));

    const memoryItems = memories.map((memory) => {
      const character = getCharacter(memory.spotId);
      return {
        id: `memory-${memory.id}`,
        kind: "memories" as const,
        title: memory.caption || character?.name || "Saved memory",
        meta: new Date(memory.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
        description: character?.blurb ?? `Saved near ${placeLabel(memory.lat, memory.lng)}.`,
        targetUrl: `/?spot=${encodeURIComponent(memory.spotId)}`,
      };
    });

    return [...people, ...places, ...tours, ...memoryItems];
  }, [memories]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter = filter === "all" || item.kind === filter;
      const matchesQuery =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.meta.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term);
      return matchesFilter && matchesQuery;
    });
  }, [filter, items, query]);

  function openResult(item: SearchItem) {
    window.location.href = item.targetUrl;
  }

  return (
    <main className="shell-screen search-screen">
      <section className="shell-panel search-panel" aria-labelledby="search-title">
        <div className="shell-heading">
          <span className="shell-kicker">
            <Search size={16} />
            Search
          </span>
          <h1 id="search-title">Find people, places, tours, and memories.</h1>
        </div>

        <label className="search-box">
          <Search size={19} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Old Haunts"
            autoComplete="off"
          />
        </label>

        <div className="filter-row" role="tablist" aria-label="Search filters">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={filter === item.id ? "is-active" : ""}
              onClick={() => setFilter(item.id)}
              role="tab"
              aria-selected={filter === item.id}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="result-count">
          <Clock size={15} />
          {results.length} result{results.length === 1 ? "" : "s"}
        </div>

        <div className="result-list">
          {results.length ? (
            results.map((item) => (
              <button className="result-row" key={item.id} type="button" onClick={() => openResult(item)}>
                <span className="result-icon" aria-hidden="true">
                  {kindIcon(item.kind)}
                </span>
                <div>
                  <p className="result-kind">{item.kind}</p>
                  <h2>{item.title}</h2>
                  <p className="result-meta">{item.meta}</p>
                  <p className="result-description">{item.description}</p>
                </div>
                <span className="result-open" aria-hidden="true">
                  <ChevronRight size={18} />
                </span>
              </button>
            ))
          ) : (
            <div className="empty-state">
              <Search size={22} />
              <h2>No matches</h2>
              <p>Try a different name, place, or tour theme.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
