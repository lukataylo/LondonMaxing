import {
  Aperture as ApertureRaw,
  BookOpen as BookOpenRaw,
  ChevronDown as ChevronDownRaw,
  ChevronLeft as ChevronLeftRaw,
  ChevronRight as ChevronRightRaw,
  ChevronUp as ChevronUpRaw,
  Coffee as CoffeeRaw,
  FlaskConical as FlaskConicalRaw,
  Footprints as FootprintsRaw,
  Landmark as LandmarkRaw,
  LocateFixed as LocateFixedRaw,
  MapPin as MapPinRaw,
  Minus as MinusRaw,
  Music as MusicRaw,
  Navigation as NavigationRaw,
  Palette as PaletteRaw,
  Pause as PauseRaw,
  Play as PlayRaw,
  Plus as PlusRaw,
  RotateCcw as RotateCcwRaw,
  Share2 as Share2Raw,
  Sparkles as SparklesRaw,
  User as UserRaw,
  Volume2 as Volume2Raw,
  X as XRaw,
} from "lucide-react";
import type { ComponentType, PointerEvent as ReactPointerEvent, SVGProps } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CHARACTER_SPOTS,
  ProximityEngine,
  getCharacter,
  getTourByGuide,
  haversineMeters,
  type Challenge,
  type Character,
  type Fix,
  type GhostSpot,
  type LatLng,
  type Memory,
  type ProximityEvent,
  type Story,
  type TimeOfDay,
  type Tour,
} from "@grudgemap/shared";
import {
  createMapboxMapRenderer,
  createPlanMapAdapter,
  type MapRenderer,
  type PlanMapView,
  type ScreenPoint,
} from "./map/mapAdapter";
import { fetchNarrationUrl, fetchStory } from "./api";
import { fetchWalkingRoute } from "./tourDirections";
import { makeStickerFromPhoto } from "./sticker";
import { ConversationBubble } from "./screens/ConversationBubble";
import { MemoryTab } from "./screens/MemoryTab";
import { TourPlayer } from "./screens/TourPlayer";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;

const Aperture = ApertureRaw as unknown as IconComponent;
const BookOpen = BookOpenRaw as unknown as IconComponent;
const ChevronDown = ChevronDownRaw as unknown as IconComponent;
const ChevronLeft = ChevronLeftRaw as unknown as IconComponent;
const ChevronRight = ChevronRightRaw as unknown as IconComponent;
const ChevronUp = ChevronUpRaw as unknown as IconComponent;
const Coffee = CoffeeRaw as unknown as IconComponent;
const FlaskConical = FlaskConicalRaw as unknown as IconComponent;
const Footprints = FootprintsRaw as unknown as IconComponent;
const Landmark = LandmarkRaw as unknown as IconComponent;
const LocateFixed = LocateFixedRaw as unknown as IconComponent;
const MapPin = MapPinRaw as unknown as IconComponent;
const Minus = MinusRaw as unknown as IconComponent;
const Music = MusicRaw as unknown as IconComponent;
const Navigation = NavigationRaw as unknown as IconComponent;
const Palette = PaletteRaw as unknown as IconComponent;
const Pause = PauseRaw as unknown as IconComponent;
const Play = PlayRaw as unknown as IconComponent;
const Plus = PlusRaw as unknown as IconComponent;
const RotateCcw = RotateCcwRaw as unknown as IconComponent;
const Share2 = Share2Raw as unknown as IconComponent;
const Sparkles = SparklesRaw as unknown as IconComponent;
const User = UserRaw as unknown as IconComponent;
const Volume2 = Volume2Raw as unknown as IconComponent;
const X = XRaw as unknown as IconComponent;

const STORAGE_KEY = "grudgemap.memories.v1";
const DEFAULT_MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";
const todayKey = () => new Date().toISOString().slice(0, 10);

type StoryMode = "map" | "story" | "challenge";
type LensId = "all" | "people" | "objects" | "architecture" | "moments" | "culture" | "memories";
type PlanDrag = {
  originX: number;
  originY: number;
  pointerId: number;
  startX: number;
  startY: number;
};

const DEMO_START: LatLng = { lat: 51.5115, lng: -0.105 };
const PLAN_VIEW_DEFAULT: PlanMapView = { offsetX: 0, offsetY: 0, zoom: 1 };

const DISPLAY_TITLES: Record<string, string> = {
  "dock-street-roastery": "Dock Street Roastery",
  "westminster-books": "Westminster Books",
  "south-bank-steps": "South Bank Steps",
  "soho-listening-bar": "Soho Listening Bar",
};

const SPOT_COPY: Record<string, { mood: string; clue: string }> = {
  "dock-street-roastery": {
    mood: "Coffee, river air, and old warehouse brick make this a saved morning spot.",
    clue: "Unlock beside the river wall",
  },
  "westminster-books": {
    mood: "A compact bookshop corner with marginal notes, tourists, and quiet regulars.",
    clue: "Unlock around Westminster",
  },
  "south-bank-steps": {
    mood: "Steps, performers, and river light turn this walk into a small ritual.",
    clue: "Unlocked on the South Bank",
  },
  "soho-listening-bar": {
    mood: "A late-night corner where records, regulars, and street noise blur together.",
    clue: "Unlocked by the west-end lanes",
  },
};

const OBJECT_SPOTS = [
  {
    id: "objects/westminster-gas-lantern",
    title: "Carting Lane Gas Lantern",
    lat: 51.5103,
    lng: -0.1201,
    unlockRadius: 35,
    icon: "object",
    seed: "A surviving Westminster gas lamp on Carting Lane, often linked with old sewer-gas street lighting stories.",
    curated: true,
  },
  {
    id: "objects/london-stone",
    title: "London Stone",
    lat: 51.5113,
    lng: -0.0905,
    unlockRadius: 35,
    icon: "object",
    seed: "The ancient London Stone set into Cannon Street, a tiny object with a huge city mythology.",
    curated: true,
  },
  {
    id: "objects/k2-phone-box",
    title: "K2 Phone Box, Broad Court",
    lat: 51.5124,
    lng: -0.1227,
    unlockRadius: 35,
    icon: "object",
    seed: "A classic red K2 telephone kiosk around Covent Garden and Broad Court.",
    curated: true,
  },
  {
    id: "objects/westminster-phone-boxes",
    title: "Westminster Phone Boxes",
    lat: 51.5011,
    lng: -0.1265,
    unlockRadius: 35,
    icon: "object",
    seed: "Red telephone boxes around Great George Street and Parliament Square, a postcard London detail.",
    curated: true,
  },
  {
    id: "objects/temple-bar-dragon",
    title: "Temple Bar Dragon",
    lat: 51.5137,
    lng: -0.1115,
    unlockRadius: 35,
    icon: "object",
    seed: "The dragon marker at Temple Bar, guarding the old ceremonial boundary of the City of London.",
    curated: true,
  },
  {
    id: "objects/cabmens-shelter",
    title: "Cabmen's Shelter, Russell Square",
    lat: 51.5226,
    lng: -0.1252,
    unlockRadius: 35,
    icon: "object",
    seed: "A green cabmen's shelter near Russell Square, part of the working-city infrastructure of London cab culture.",
    curated: true,
  },
  {
    id: "objects/pillar-box",
    title: "Pillar Box, Trafalgar Square",
    lat: 51.5085,
    lng: -0.128,
    unlockRadius: 35,
    icon: "object",
    seed: "A red Royal Mail pillar box around Trafalgar Square and St Martin-in-the-Fields.",
    curated: true,
  },
  {
    id: "objects/covent-garden-postbox",
    title: "Covent Garden Postbox",
    lat: 51.5118,
    lng: -0.1231,
    unlockRadius: 35,
    icon: "object",
    seed: "A red postbox in the Covent Garden streets, a small everyday landmark for object hunters.",
    curated: true,
  },
  {
    id: "objects/routemaster",
    title: "Routemaster, London Transport Museum",
    lat: 51.5121,
    lng: -0.1218,
    unlockRadius: 40,
    icon: "object",
    seed: "A Routemaster bus connection around the London Transport Museum in Covent Garden.",
    curated: true,
  },
  {
    id: "objects/belisha-beacon",
    title: "Belisha Beacon, Abbey Road",
    lat: 51.532,
    lng: -0.1774,
    unlockRadius: 40,
    icon: "object",
    seed: "The black-and-white crossing beacon at Abbey Road, a small object with global pop-cultural gravity.",
    curated: true,
  },
  {
    id: "objects/black-cab",
    title: "Black Cab Rank, Charing Cross",
    lat: 51.508,
    lng: -0.1248,
    unlockRadius: 45,
    icon: "object",
    seed: "A black cab rank near Charing Cross, a moving London object pinned to a reliable pickup point.",
    curated: true,
  },
  {
    id: "objects/victorian-fountain",
    title: "Victorian Drinking Fountain",
    lat: 51.5135,
    lng: -0.1037,
    unlockRadius: 40,
    icon: "object",
    seed: "A Victorian drinking-fountain style object around the City, a reminder of public health infrastructure.",
    curated: true,
  },
] satisfies GhostSpot[];

const BUILDING_SPOTS = [
  {
    id: "buildings/st-pauls-cathedral",
    title: "St Paul's Cathedral",
    lat: 51.5138,
    lng: -0.0984,
    unlockRadius: 55,
    icon: "building",
    seed: "Wren's great dome over Ludgate Hill, rebuilt after the Great Fire and still one of London's strongest skyline anchors.",
    curated: true,
  },
  {
    id: "buildings/guildhall",
    title: "Guildhall",
    lat: 51.5159,
    lng: -0.0915,
    unlockRadius: 45,
    icon: "building",
    seed: "The ceremonial heart of the City of London, with medieval civic power still visible in stone and glass.",
    curated: true,
  },
  {
    id: "buildings/mansion-house",
    title: "Mansion House",
    lat: 51.5132,
    lng: -0.0891,
    unlockRadius: 45,
    icon: "building",
    seed: "The Lord Mayor's official residence, sitting at the junction of City finance and civic theatre.",
    curated: true,
  },
  {
    id: "buildings/bank-of-england",
    title: "Bank of England",
    lat: 51.5142,
    lng: -0.0885,
    unlockRadius: 45,
    icon: "building",
    seed: "The old fortress-like Bank of England, a symbol of London finance around Threadneedle Street.",
    curated: true,
  },
  {
    id: "buildings/royal-exchange",
    title: "Royal Exchange",
    lat: 51.5136,
    lng: -0.0876,
    unlockRadius: 45,
    icon: "building",
    seed: "The Royal Exchange portico, where London's trading rituals took architectural form.",
    curated: true,
  },
  {
    id: "buildings/leadenhall-market",
    title: "Leadenhall Market",
    lat: 51.5127,
    lng: -0.0834,
    unlockRadius: 45,
    icon: "building",
    seed: "A Victorian market arcade with painted ironwork, glass, lunch crowds, and film-location recognition.",
    curated: true,
  },
  {
    id: "buildings/old-bailey",
    title: "Old Bailey",
    lat: 51.5159,
    lng: -0.1019,
    unlockRadius: 45,
    icon: "building",
    seed: "The Central Criminal Court, watched over by Lady Justice and centuries of London trials.",
    curated: true,
  },
  {
    id: "buildings/lloyds-building",
    title: "Lloyd's Building",
    lat: 51.5138,
    lng: -0.0824,
    unlockRadius: 45,
    icon: "building",
    seed: "Richard Rogers' inside-out insurance market building, all pipes, lifts, and City futurism.",
    curated: true,
  },
  {
    id: "buildings/gherkin",
    title: "The Gherkin",
    lat: 51.5145,
    lng: -0.0803,
    unlockRadius: 50,
    icon: "building",
    seed: "30 St Mary Axe, the glass landmark that made modern City architecture instantly legible.",
    curated: true,
  },
  {
    id: "buildings/barbican-centre",
    title: "Barbican Centre",
    lat: 51.5202,
    lng: -0.0938,
    unlockRadius: 55,
    icon: "building",
    seed: "Brutalist terraces, lakes, arts venues, and walkways forming one of London's most distinctive urban worlds.",
    curated: true,
  },
] satisfies GhostSpot[];

const LANDMARK_SPOTS = [
  {
    id: "landmarks/tower-bridge",
    title: "Tower Bridge",
    lat: 51.5055,
    lng: -0.0754,
    unlockRadius: 55,
    icon: "building",
    seed: "The bascule bridge over the Thames, built for river traffic and now one of London's clearest postcard silhouettes.",
    curated: true,
  },
  {
    id: "landmarks/tower-of-london",
    title: "Tower of London",
    lat: 51.5081,
    lng: -0.0759,
    unlockRadius: 55,
    icon: "building",
    seed: "The fortress beside the Thames: royal palace, prison, armoury, mint, and home of the Crown Jewels.",
    curated: true,
  },
  {
    id: "landmarks/shard",
    title: "The Shard",
    lat: 51.5045,
    lng: -0.0865,
    unlockRadius: 55,
    icon: "building",
    seed: "Renzo Piano's glass spire above London Bridge, designed as a vertical city in the skyline.",
    curated: true,
  },
  {
    id: "landmarks/london-bridge",
    title: "London Bridge",
    lat: 51.5079,
    lng: -0.0877,
    unlockRadius: 50,
    icon: "building",
    seed: "The modern bridge on an ancient crossing point, linking layers of Roman, medieval, and commuter London.",
    curated: true,
  },
  {
    id: "landmarks/monument-great-fire",
    title: "Monument to the Great Fire",
    lat: 51.5101,
    lng: -0.086,
    unlockRadius: 45,
    icon: "building",
    seed: "Wren and Hooke's column marking the Great Fire, built close to where the 1666 blaze began.",
    curated: true,
  },
  {
    id: "landmarks/sky-garden",
    title: "Sky Garden",
    lat: 51.5113,
    lng: -0.0835,
    unlockRadius: 45,
    icon: "building",
    seed: "The public garden high inside 20 Fenchurch Street, looking back over the City it rises from.",
    curated: true,
  },
  {
    id: "landmarks/tate-modern",
    title: "Tate Modern",
    lat: 51.5076,
    lng: -0.0994,
    unlockRadius: 55,
    icon: "building",
    seed: "A Bankside power station turned modern art museum, with the Turbine Hall as its civic-scale interior.",
    curated: true,
  },
  {
    id: "landmarks/shakespeares-globe",
    title: "Shakespeare's Globe",
    lat: 51.5081,
    lng: -0.0972,
    unlockRadius: 45,
    icon: "building",
    seed: "A reconstructed open-air playhouse on Bankside, reconnecting theatre to the river edge.",
    curated: true,
  },
  {
    id: "landmarks/southwark-cathedral",
    title: "Southwark Cathedral",
    lat: 51.5069,
    lng: -0.0899,
    unlockRadius: 45,
    icon: "building",
    seed: "A cathedral beside Borough Market and London Bridge, carrying medieval Southwark into the present.",
    curated: true,
  },
  {
    id: "landmarks/hms-belfast",
    title: "HMS Belfast",
    lat: 51.5066,
    lng: -0.0817,
    unlockRadius: 45,
    icon: "building",
    seed: "The Second World War cruiser moored on the Thames, now a floating museum of naval London.",
    curated: true,
  },
  {
    id: "landmarks/city-hall-london",
    title: "City Hall",
    lat: 51.5049,
    lng: -0.0786,
    unlockRadius: 45,
    icon: "building",
    seed: "The glass riverside former City Hall near Tower Bridge, part of Southwark's modern civic waterfront.",
    curated: true,
  },
  {
    id: "landmarks/oxo-tower",
    title: "OXO Tower",
    lat: 51.5081,
    lng: -0.1089,
    unlockRadius: 45,
    icon: "building",
    seed: "The South Bank tower whose letters turned advertising into architecture.",
    curated: true,
  },
  {
    id: "landmarks/borough-market",
    title: "Borough Market",
    lat: 51.5055,
    lng: -0.0911,
    unlockRadius: 45,
    icon: "building",
    seed: "London's historic food market under green ironwork, where railway arches, lunch queues, and old trade meet.",
    curated: true,
  },
  {
    id: "landmarks/kia-oval",
    title: "The Kia Oval",
    lat: 51.4837,
    lng: -0.1149,
    unlockRadius: 60,
    icon: "building",
    seed: "The Oval cricket ground in Kennington, one of London's great sporting venues.",
    curated: true,
  },
  {
    id: "landmarks/battersea-power-station",
    title: "Battersea Power Station",
    lat: 51.4817,
    lng: -0.1447,
    unlockRadius: 60,
    icon: "building",
    seed: "The four-chimney power station on the Thames, reborn as a retail and riverside district.",
    curated: true,
  },
  {
    id: "landmarks/design-museum",
    title: "Design Museum",
    lat: 51.499,
    lng: -0.2002,
    unlockRadius: 55,
    icon: "building",
    seed: "The Kensington museum for industrial, graphic, fashion, and architectural design.",
    curated: true,
  },
  {
    id: "landmarks/canary-wharf",
    title: "Canary Wharf",
    lat: 51.5054,
    lng: -0.0235,
    unlockRadius: 65,
    icon: "building",
    seed: "Docklands' high-rise financial district, built over the old working docks.",
    curated: true,
  },
  {
    id: "landmarks/one-canada-square",
    title: "One Canada Square",
    lat: 51.5048,
    lng: -0.0195,
    unlockRadius: 55,
    icon: "building",
    seed: "The pyramid-topped tower that made Canary Wharf visible across east London.",
    curated: true,
  },
  {
    id: "landmarks/25-bank-street",
    title: "25 Bank Street",
    lat: 51.5046,
    lng: -0.0188,
    unlockRadius: 50,
    icon: "building",
    seed: "A Docklands office tower on Bank Street, part of Canary Wharf's glass canyon.",
    curated: true,
  },
  {
    id: "landmarks/hsbc-tower",
    title: "HSBC Tower",
    lat: 51.5052,
    lng: -0.0177,
    unlockRadius: 50,
    icon: "building",
    seed: "The HSBC tower at Canary Wharf, one of the district's defining finance landmarks.",
    curated: true,
  },
  {
    id: "landmarks/citi-tower",
    title: "Citi Tower",
    lat: 51.5044,
    lng: -0.0198,
    unlockRadius: 50,
    icon: "building",
    seed: "A Canary Wharf tower stitched into Docklands' global-finance skyline.",
    curated: true,
  },
  {
    id: "landmarks/canary-wharf-station",
    title: "Canary Wharf Station",
    lat: 51.5036,
    lng: -0.0198,
    unlockRadius: 45,
    icon: "building",
    seed: "The station concourse that made Docklands' towers flow into the Jubilee line.",
    curated: true,
  },
  {
    id: "landmarks/middle-dock",
    title: "Middle Dock",
    lat: 51.5042,
    lng: -0.0221,
    unlockRadius: 45,
    icon: "building",
    seed: "A remaining water space in Canary Wharf, showing the docklands below the office grid.",
    curated: true,
  },
  {
    id: "landmarks/south-quay-plaza",
    title: "South Quay Plaza",
    lat: 51.5011,
    lng: -0.0175,
    unlockRadius: 50,
    icon: "building",
    seed: "A tall residential cluster south of Canary Wharf, part of Docklands' newer vertical neighbourhood.",
    curated: true,
  },
  {
    id: "landmarks/billingsgate-market",
    title: "Billingsgate Market",
    lat: 51.505,
    lng: -0.0146,
    unlockRadius: 50,
    icon: "building",
    seed: "The Docklands fish market building carrying forward one of London's old trading names.",
    curated: true,
  },
  {
    id: "landmarks/cable-car-emirates-air-line",
    title: "Cable Car",
    lat: 51.4997,
    lng: 0.0083,
    unlockRadius: 60,
    icon: "building",
    seed: "The cable car crossing near Royal Docks, turning a river crossing into a skyline ride.",
    curated: true,
  },
] satisfies GhostSpot[];

const OBJECT_SPOT_IDS = new Set(OBJECT_SPOTS.map((spot) => spot.id));
const FEATURED_OBJECT_SPOT_IDS = new Set(["objects/k2-phone-box", "objects/pillar-box"]);
const BUILDING_SPOT_IDS = new Set([...BUILDING_SPOTS, ...LANDMARK_SPOTS].map((spot) => spot.id));
const FEATURED_BUILDING_SPOT_IDS = new Set(["buildings/st-pauls-cathedral", "buildings/gherkin"]);
const BUILDING_DETAIL_RANKS = new Map<string, number>([
  ["buildings/st-pauls-cathedral", 0],
  ["buildings/gherkin", 0],
  ["buildings/bank-of-england", 1],
  ["buildings/royal-exchange", 1],
  ["buildings/barbican-centre", 1],
  ["buildings/guildhall", 3],
  ["buildings/mansion-house", 3],
  ["buildings/leadenhall-market", 3],
  ["buildings/old-bailey", 3],
  ["buildings/lloyds-building", 3],
  ["landmarks/tower-bridge", 1],
  ["landmarks/tower-of-london", 1],
  ["landmarks/shard", 1],
  ["landmarks/london-bridge", 1],
  ["landmarks/monument-great-fire", 2],
  ["landmarks/sky-garden", 2],
  ["landmarks/tate-modern", 2],
  ["landmarks/shakespeares-globe", 2],
  ["landmarks/southwark-cathedral", 3],
  ["landmarks/hms-belfast", 3],
  ["landmarks/city-hall-london", 3],
  ["landmarks/oxo-tower", 3],
  ["landmarks/borough-market", 2],
  ["landmarks/kia-oval", 3],
  ["landmarks/battersea-power-station", 3],
  ["landmarks/design-museum", 3],
  ["landmarks/canary-wharf", 3],
  ["landmarks/one-canada-square", 3],
  ["landmarks/25-bank-street", 3],
  ["landmarks/hsbc-tower", 3],
  ["landmarks/citi-tower", 3],
  ["landmarks/canary-wharf-station", 3],
  ["landmarks/middle-dock", 3],
  ["landmarks/south-quay-plaza", 3],
  ["landmarks/billingsgate-market", 3],
  ["landmarks/cable-car-emirates-air-line", 3],
]);

const LENSES: Array<{ id: LensId; label: string; iconSrc: string }> = [
  { id: "all", label: "All", iconSrc: "/lenses/all.png" },
  { id: "people", label: "People", iconSrc: "/lenses/people.png" },
  { id: "objects", label: "Objects", iconSrc: "/lenses/objects.png" },
  { id: "architecture", label: "Buildings", iconSrc: "/lenses/buildings.png" },
  { id: "moments", label: "Moments", iconSrc: "/lenses/moments.png" },
  { id: "culture", label: "Culture", iconSrc: "/lenses/culture.png" },
  { id: "memories", label: "Memories", iconSrc: "/lenses/memories.png" },
];

export type AppAccount = {
  signedIn: boolean;
  email?: string;
  onSignIn: () => void;
  onSignOut: () => void;
};

export function App({ account }: { account?: AppAccount } = {}) {
  const spots = useMemo(() => [...CHARACTER_SPOTS, ...OBJECT_SPOTS, ...BUILDING_SPOTS, ...LANDMARK_SPOTS], []);
  const [size, setSize] = useState({ width: 900, height: 720 });
  const [position, setPosition] = useState<LatLng>(DEMO_START);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [activeLens, setActiveLens] = useState<LensId>(() => readInitialLens());
  const [selectedId, setSelectedId] = useState(() => readInitialSpotId(spots));
  const [storyMode, setStoryMode] = useState<StoryMode>("map");
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [memories, setMemories] = useState<Memory[]>(() => readMemories());
  const [shareStatus, setShareStatus] = useState<"idle" | "sent" | "copied" | "failed">("idle");
  const [fixStatus, setFixStatus] = useState("Demo position");
  const [walkMeters, setWalkMeters] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [narrationPaused, setNarrationPaused] = useState(false);
  const [narrationTitle, setNarrationTitle] = useState("");
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [showMemoryTab, setShowMemoryTab] = useState(false);
  const [tourState, setTourState] = useState<{ open: boolean; tourId?: string }>({ open: false });
  const [convoCharacter, setConvoCharacter] = useState<Character | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mapboxAdapter, setMapboxAdapter] = useState<MapRenderer["adapter"] | null>(null);
  const [planView, setPlanView] = useState<PlanMapView>(PLAN_VIEW_DEFAULT);
  const [mapProjectionTick, setMapProjectionTick] = useState(0);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapboxContainerRef = useRef<HTMLDivElement | null>(null);
  const mapboxRendererRef = useRef<MapRenderer | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const walkAnimationRef = useRef<number | null>(null);
  // Monotonic id: every narrate()/stopNarration() bumps it so stale audio/speech
  // callbacks (late error/end events) can detect they're obsolete and bail —
  // this prevents the "keeps restarting" loop where repeated media-error events
  // each re-triggered the speech fallback from the beginning.
  const narrationTokenRef = useRef(0);
  const lastWalkPoint = useRef<LatLng | null>(null);
  const planDragRef = useRef<PlanDrag | null>(null);

  const memorySpotIds = useMemo(() => new Set(memories.map((memory) => memory.spotId)), [memories]);
  const mapDetail = getMapDetailLevel(mapboxAdapter ?? undefined, planView.zoom, mapProjectionTick);
  const visibleSpots = useMemo(
    () => filterSpotsByLens(spots, activeLens, memorySpotIds, mapDetail),
    [activeLens, mapDetail, memorySpotIds, spots]
  );
  const selectedSpot = selectedId
    ? visibleSpots.find((spot) => spot.id === selectedId)
    : visibleSpots[0] ?? spots[0];
  const planAdapter = useMemo(() => createPlanMapAdapter(spots, size, planView), [planView, spots, size]);
  const adapter = mapboxAdapter ?? planAdapter;
  const userPoint = adapter.project(position);
  const mapboxToken = getEnvValue(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN);
  const mapboxStyle = getEnvValue(import.meta.env.VITE_MAPBOX_STYLE) ?? DEFAULT_MAPBOX_STYLE;

  const engineRef = useRef<ProximityEngine | null>(null);

  useEffect(() => {
    const engine = new ProximityEngine((event: ProximityEvent) => {
      if (event.type === "position") {
        setPosition(event.point);
      }
      if (event.type === "activate") {
        setActiveIds((ids) => new Set(ids).add(event.spot.id));
        setSelectedId(event.spot.id);
        setFixStatus(`Unlocked ${Math.round(event.distance)}m away`);
      }
      if (event.type === "deactivate") {
        setActiveIds((ids) => {
          const next = new Set(ids);
          next.delete(event.spot.id);
          return next;
        });
      }
    });
    engine.setSpots(spots);
    engineRef.current = engine;
    injectFix({ ...DEMO_START, accuracy: 15, synthetic: true });

    // Ask for the real device location straight away so the user pin is accurate
    // (falls back silently to the demo position if denied/unavailable).
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setFixStatus("Locating…");
      navigator.geolocation.getCurrentPosition(
        (geo) => {
          engine.onFix({
            lat: geo.coords.latitude,
            lng: geo.coords.longitude,
            accuracy: geo.coords.accuracy,
            timestamp: Date.now(),
          });
          setFixStatus(`GPS ${Math.round(geo.coords.accuracy)}m accuracy`);
        },
        () => setFixStatus("Demo position (location blocked)"),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 2000 }
      );
    }
    return () => {
      engineRef.current = null;
    };
  }, [spots]);

  useEffect(() => {
    if (!selectedId || visibleSpots.some((spot) => spot.id === selectedId)) return;
    setSelectedId("");
    setStoryMode("map");
    setCurrentStory(null);
    stopNarration();
  }, [selectedId, visibleSpots]);

  useEffect(
    () => () => {
      stopNarration();
      if (walkAnimationRef.current !== null) {
        cancelAnimationFrame(walkAnimationRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const node = mapRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({
        width: Math.max(320, entry.contentRect.width),
        height: Math.max(360, entry.contentRect.height),
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = mapboxContainerRef.current;
    if (!container || !mapboxToken) {
      mapboxRendererRef.current?.destroy();
      mapboxRendererRef.current = null;
      setMapboxAdapter(null);
      return;
    }

    let cancelled = false;
    let renderer: MapRenderer | null = null;

    try {
      renderer = createMapboxMapRenderer({
        accessToken: mapboxToken,
        center: position,
        container,
        onError: (error) => {
          console.warn("Falling back to plan map", error);
          renderer?.destroy();
          if (!cancelled) {
            mapboxRendererRef.current = null;
            setMapboxAdapter(null);
          }
        },
        onReady: () => {
          if (!cancelled && renderer) {
            mapboxRendererRef.current = renderer;
            setMapboxAdapter(renderer.adapter);
          }
        },
        onViewChange: () => setMapProjectionTick((tick) => tick + 1),
        size,
        spots,
        styleUrl: mapboxStyle,
      });
    } catch (error) {
      console.warn("Falling back to plan map", error);
      setMapboxAdapter(null);
    }

    return () => {
      cancelled = true;
      renderer?.destroy();
      if (mapboxRendererRef.current === renderer) {
        mapboxRendererRef.current = null;
      }
      setMapboxAdapter(null);
    };
  }, [mapboxStyle, mapboxToken, spots]);

  useEffect(() => {
    mapboxRendererRef.current?.resize();
  }, [size]);

  useEffect(() => {
    mapboxRendererRef.current?.setUserPosition(position);
  }, [position]);

  // Unlock audio playback on the first user gesture so narration can start on
  // mobile/PWA (Android/iOS block play() that happens after an async fetch,
  // outside the original gesture). We create one persistent <audio>, play+pause
  // it silently within the gesture, then reuse it for all narration.
  useEffect(() => {
    const unlock = () => {
      try {
        const a = audioRef.current ?? new Audio();
        audioRef.current = a;
        a.muted = true;
        const p = a.play();
        if (p && typeof p.then === "function") {
          p.then(() => {
            a.pause();
            try { a.currentTime = 0; } catch { /* ignore */ }
            a.muted = false;
          }).catch(() => {
            a.muted = false;
          });
        }
      } catch { /* ignore */ }
      // Prime speechSynthesis voices (Android loads them lazily).
      try { window.speechSynthesis?.getVoices(); } catch { /* ignore */ }
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchend", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("touchend", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchend", unlock);
    };
  }, []);

  // Preview a walking route from the user to the selected character.
  // Clears the line when nothing is selected or the map isn't ready.
  useEffect(() => {
    const renderer = mapboxRendererRef.current;
    if (!renderer) return;
    if (!selectedId || !mapboxToken) {
      renderer.setRoute(null);
      return;
    }
    const target = spots.find((spot) => spot.id === selectedId);
    if (!target) {
      renderer.setRoute(null);
      return;
    }
    let cancelled = false;
    fetchWalkingRoute(
      [position, { lat: target.lat, lng: target.lng }],
      mapboxToken
    )
      .then((geometry) => {
        if (!cancelled) mapboxRendererRef.current?.setRoute(geometry);
      })
      .catch(() => {
        if (!cancelled) mapboxRendererRef.current?.setRoute(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, mapboxAdapter, mapboxToken, position, spots]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    if (shareStatus === "idle") return;
    const timer = window.setTimeout(() => setShareStatus("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [shareStatus]);

  const sortedVisibleSpots = useMemo(
    () =>
      visibleSpots
        .map((spot) => ({
          spot,
          distance: haversineMeters(position, { lat: spot.lat, lng: spot.lng }),
          active: activeIds.has(spot.id),
        }))
        .sort((a, b) => a.distance - b.distance),
    [activeIds, position, visibleSpots]
  );

  const todayMemories = useMemo(
    () => memories.filter((memory) => memory.day === todayKey()),
    [memories]
  );

  const selectedDistance = selectedSpot
    ? haversineMeters(position, { lat: selectedSpot.lat, lng: selectedSpot.lng })
    : 0;
  const selectedUnlocked = selectedSpot ? activeIds.has(selectedSpot.id) : false;

  function injectFix(fix: Omit<Fix, "timestamp">) {
    engineRef.current?.onFix({ ...fix, timestamp: Date.now() });
  }

  function selectSpot(spot: GhostSpot) {
    setSelectedId(spot.id);
    setStoryMode("map");
    setCurrentStory(null);
    setCapturedPhotoUrl(null);
    stopNarration();
    setFixStatus(activeIds.has(spot.id) ? "Spot selected" : "Spot selected; tap unlock");
  }

  function unlockSpotNow(spot: GhostSpot) {
    setSelectedId(spot.id);
    setPosition({ lat: spot.lat, lng: spot.lng });
    setActiveIds((ids) => new Set(ids).add(spot.id));
    setFixStatus(`Unlocked ${displaySpotTitle(spot)}`);
  }

  function walkToSpot(spot: GhostSpot) {
    if (walkAnimationRef.current !== null) {
      cancelAnimationFrame(walkAnimationRef.current);
      walkAnimationRef.current = null;
    }
    const name = getCharacter(spot.id)?.name ?? displaySpotTitle(spot);
    const start = position;
    const startTime = performance.now();
    const duration = 1100;
    setFixStatus(`Walking to ${name}…`);
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t * (2 - t);
      const lat = start.lat + (spot.lat - start.lat) * eased;
      const lng = start.lng + (spot.lng - start.lng) * eased;
      setPosition({ lat, lng });
      if (t < 1) {
        walkAnimationRef.current = requestAnimationFrame(step);
      } else {
        walkAnimationRef.current = null;
        setActiveIds((ids) => new Set(ids).add(spot.id));
        setFixStatus(`Arrived at ${name}`);
      }
    };
    walkAnimationRef.current = requestAnimationFrame(step);
  }

  function locateUser() {
    if (!navigator.geolocation) {
      setFixStatus("Geolocation unavailable");
      return;
    }

    setFixStatus("Locating...");
    navigator.geolocation.getCurrentPosition(
      (geo) => {
        injectFix({
          lat: geo.coords.latitude,
          lng: geo.coords.longitude,
          accuracy: geo.coords.accuracy,
        });
        setFixStatus(`GPS ${Math.round(geo.coords.accuracy)}m accuracy`);
      },
      () => setFixStatus("Location permission blocked"),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 2000 }
    );
  }

  async function beginStory(spot: GhostSpot) {
    if (!activeIds.has(spot.id)) {
      unlockSpotNow(spot);
    }

    // Show a character-voiced fallback instantly, then upgrade with Gemini.
    const fallback = createCharacterStory(spot);
    setCurrentStory(fallback);
    setStoryMode("story");
    setWalkMeters(0);
    setCapturedPhotoUrl(null);
    lastWalkPoint.current = null;
    stopNarration();

    const character = getCharacter(spot.id);
    const remote = await fetchStory({
      spotId: spot.id,
      lat: spot.lat,
      lng: spot.lng,
      timeOfDay: getTimeOfDay(),
      placeName: spot.title,
      seed: character?.persona,
    });
    if (remote) {
      setCurrentStory((cur) =>
        cur && cur.spotId === spot.id
          ? { spotId: spot.id, title: remote.title, narration: remote.narration, challenge: remote.challenge }
          : cur
      );
    }
  }

  async function narrate() {
    const story = currentStory;
    if (!story) return;
    stopNarration();
    const token = ++narrationTokenRef.current;
    setIsListening(true);
    setNarrationPaused(false);
    const character = getCharacter(story.spotId);
    const spot = spots.find((s) => s.id === story.spotId);
    setNarrationTitle(character?.name ?? (spot ? displaySpotTitle(spot) : story.title));

    // Kick off the browser-speech fallback synchronously-reachable path: Android
    // requires speechSynthesis.speak() to run close to the user gesture, so if the
    // network voice isn't available we want the fallback ASAP. Prime voices now.
    if ("speechSynthesis" in window) {
      try { window.speechSynthesis.getVoices(); } catch { /* ignore */ }
    }

    // Prefer the real ElevenLabs voice from the backend; fall back to browser TTS.
    const url = await fetchNarrationUrl({ text: story.narration, spotId: story.spotId });

    // A newer narration started (or we were stopped) while awaiting — abandon this one.
    if (token !== narrationTokenRef.current) {
      if (url) URL.revokeObjectURL(url);
      return;
    }

    if (url) {
      // Reuse the persistent (gesture-unlocked) element so play() is allowed on
      // mobile/PWA even though we're now past the original user gesture.
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.preload = "auto";
      audio.muted = false;
      audio.src = url;
      try { audio.currentTime = 0; } catch { /* ignore */ }
      let fellBack = false;
      audio.onended = () => {
        if (token !== narrationTokenRef.current) return;
        setIsListening(false);
        setNarrationPaused(false);
      };
      audio.onerror = () => {
        // One-shot: only fall back once, only for the active narration, and only
        // if playback never actually started (ignore late/duplicate error events).
        if (fellBack || token !== narrationTokenRef.current) return;
        if (audio.currentTime > 0 || !audio.paused) return;
        fellBack = true;
        speakBrowser(story, token);
      };
      try {
        await audio.play();
        return;
      } catch {
        // Autoplay blocked or playback failed — fall back to browser speech once.
        if (!fellBack && token === narrationTokenRef.current) {
          fellBack = true;
          speakBrowser(story, token);
        }
        return;
      }
    }
    speakBrowser(story, token);
  }

  function speakBrowser(story: Story, token: number) {
    if (!("speechSynthesis" in window) || token !== narrationTokenRef.current) {
      setIsListening(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(story.narration);
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    utterance.onend = () => {
      if (token !== narrationTokenRef.current) return;
      setIsListening(false);
      setNarrationPaused(false);
    };
    utterance.onerror = () => {
      if (token !== narrationTokenRef.current) return;
      setIsListening(false);
      setNarrationPaused(false);
    };
    speechRef.current = utterance;
    setNarrationPaused(false);
    window.speechSynthesis.speak(utterance);
  }

  function pauseNarration() {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
    setNarrationPaused(true);
  }

  function resumeNarration() {
    if (audioRef.current) {
      void audioRef.current.play().catch(() => {});
    }
    if ("speechSynthesis" in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    setNarrationPaused(false);
  }

  function toggleNarrationPause() {
    if (narrationPaused) {
      resumeNarration();
    } else {
      pauseNarration();
    }
  }

  function stopNarration() {
    // Invalidate any in-flight narration so its async callbacks no-op.
    narrationTokenRef.current++;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    speechRef.current = null;
    // Pause + reset but KEEP the element — it stays gesture-unlocked for mobile,
    // so the next narration can play without a fresh user gesture.
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      try { audioRef.current.currentTime = 0; } catch { /* ignore */ }
    }
    setIsListening(false);
    setNarrationPaused(false);
  }

  function advanceWalk() {
    if (!selectedSpot) return;
    const nextPoint = lastWalkPoint.current
      ? {
          lat: lastWalkPoint.current.lat + 0.00013,
          lng: lastWalkPoint.current.lng + 0.00008,
        }
      : { lat: selectedSpot.lat + 0.00012, lng: selectedSpot.lng + 0.0001 };

    const prev = lastWalkPoint.current ?? { lat: selectedSpot.lat, lng: selectedSpot.lng };
    const gained = haversineMeters(prev, nextPoint);
    lastWalkPoint.current = nextPoint;
    setWalkMeters((meters) => meters + gained);
  }

  async function saveMemory(kind: "selfie" | "walk") {
    if (!selectedSpot) return;
    const character = getCharacter(selectedSpot.id);
    let photoUrl: string;
    let stickerUrl: string;
    if (kind === "selfie" && capturedPhotoUrl) {
      photoUrl = capturedPhotoUrl;
      // Pass a generated SVG sticker as the fallback so a photo that can't be
      // processed never leaves a black/blank square in the scrapbook.
      stickerUrl = await makeStickerFromPhoto(
        capturedPhotoUrl,
        character?.name ?? selectedSpot.title,
        createStickerDataUrl(selectedSpot, kind, true),
      );
    } else {
      photoUrl = createStickerDataUrl(selectedSpot, kind, false);
      stickerUrl = createStickerDataUrl(selectedSpot, kind, true);
    }
    const memory: Memory = {
      id: crypto.randomUUID(),
      day: todayKey(),
      spotId: selectedSpot.id,
      photoUrl,
      stickerUrl,
      caption: character ? `Met ${character.name}` : "Memory captured",
      lat: position.lat,
      lng: position.lng,
      createdAt: Date.now(),
    };
    setMemories((items) => [memory, ...items]);
    setStoryMode("map");
    setCurrentStory(null);
    setCapturedPhotoUrl(null);
    stopNarration();
  }

  function handleCapturePhoto(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCapturedPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function setPlanZoom(nextZoom: number) {
    setPlanView((view) => ({
      ...view,
      zoom: Math.max(0.72, Math.min(2.35, nextZoom)),
    }));
  }

  function zoomMapBy(delta: number) {
    if (mapboxRendererRef.current) {
      mapboxRendererRef.current.zoomBy(delta);
      setFixStatus(delta > 0 ? "Zoomed in" : "Zoomed out");
      return;
    }
    setPlanZoom(planView.zoom + delta * 0.3);
  }

  function panPlanBy(x: number, y: number) {
    setPlanView((view) => ({
      ...view,
      offsetX: clampPlanOffset(view.offsetX + x),
      offsetY: clampPlanOffset(view.offsetY + y),
    }));
  }

  function resetPlanView() {
    if (mapboxRendererRef.current) {
      mapboxRendererRef.current.resetView();
      setFixStatus("Map view reset");
      return;
    }
    setPlanView(PLAN_VIEW_DEFAULT);
    setFixStatus("Map view reset");
  }

  function chooseLens(nextLens: LensId) {
    setActiveLens(nextLens);
    const nextVisibleSpots = filterSpotsByLens(spots, nextLens, memorySpotIds, mapDetail);
    if (selectedId && !nextVisibleSpots.some((spot) => spot.id === selectedId)) {
      setSelectedId("");
      setStoryMode("map");
      setCurrentStory(null);
      stopNarration();
    }
  }

  async function shareCurrentContext() {
    const url = createContextUrl(activeLens, selectedId, storyMode);
    const spotName = selectedId && selectedSpot ? displaySpotTitle(selectedSpot) : "Old Haunts map";
    const lensName = LENSES.find((lens) => lens.id === activeLens)?.label ?? "All";
    const shareData: ShareData = {
      title: spotName,
      text: `Old Haunts: ${spotName} (${lensName})`,
      url,
    };

    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        setShareStatus("sent");
        return;
      }
      await copyToClipboard(url);
      setShareStatus("copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await copyToClipboard(url);
        setShareStatus("copied");
      } catch {
        setShareStatus("failed");
        setFixStatus("Share link unavailable");
      }
    }
  }

  function handlePlanPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (mapboxAdapter || storyMode !== "map" || isInteractiveTarget(event.target)) return;
    // Ignore additional fingers — a second touch starting while a drag is live
    // would otherwise hijack planDragRef and produce jittery movement. It also
    // prevents the plan-map from fighting a pinch gesture on mobile.
    if (planDragRef.current !== null) return;
    planDragRef.current = {
      originX: planView.offsetX,
      originY: planView.offsetY,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePlanPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const drag = planDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPlanView((view) => ({
      ...view,
      offsetX: clampPlanOffset(drag.originX + event.clientX - drag.startX),
      offsetY: clampPlanOffset(drag.originY + event.clientY - drag.startY),
    }));
  }

  function handlePlanPointerEnd(event: ReactPointerEvent<HTMLElement>) {
    if (planDragRef.current?.pointerId === event.pointerId) {
      planDragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const currentChallenge = currentStory?.challenge;
  const challengeComplete =
    currentChallenge?.type === "walk"
      ? walkMeters >= currentChallenge.targetMeters
      : currentChallenge?.type === "selfie"
        ? Boolean(capturedPhotoUrl)
        : false;

  const selectedWithinRadius = selectedSpot
    ? selectedDistance <= selectedSpot.unlockRadius
    : false;
  const selectedCanOpen = selectedUnlocked || selectedWithinRadius;

  function handlePrimaryAction() {
    if (!selectedSpot) return;
    if (selectedCanOpen) {
      beginStory(selectedSpot);
    } else {
      walkToSpot(selectedSpot);
    }
  }

  // Re-projected every render (incl. the mapbox view tick) so collision offsets
  // track the live map; cheap for a handful of pins.
  const pinPlacement = declutterPoints(
    visibleSpots.map((spot) => ({
      spot,
      point: adapter.project({ lat: spot.lat, lng: spot.lng }),
    }))
  );

  return (
    <main className="app-shell">
      <section
        className={`map-stage ${mapboxAdapter ? "has-mapbox" : "has-plan-map"}`}
        ref={mapRef}
        aria-label="Favorite spots map"
        onPointerDown={handlePlanPointerDown}
        onPointerMove={handlePlanPointerMove}
        onPointerUp={handlePlanPointerEnd}
        onPointerCancel={handlePlanPointerEnd}
      >
        <div className={`mapbox-layer ${mapboxAdapter ? "is-ready" : ""}`} ref={mapboxContainerRef} aria-hidden="true" />
        <div className="plan-map" style={planViewStyle(planView)} aria-hidden={mapboxAdapter ? "true" : undefined}>
          <MapBackdrop />
          <div className="route route-one" />
          <div className="route route-two" />
          <div className="route route-three" />
          <div className="river" />
          <div className="map-label label-north">Soho</div>
          <div className="map-label label-river">River Thames</div>
          <div className="map-label label-east">Dock Street</div>
        </div>

        {visibleSpots.map((spot) => (
          <PlacePin
            key={spot.id}
            spot={spot}
            point={pinPlacement.get(spot.id) ?? adapter.project({ lat: spot.lat, lng: spot.lng })}
            isActive={activeIds.has(spot.id)}
            hasMemory={memorySpotIds.has(spot.id)}
            isSelected={selectedId === spot.id}
            onClick={() => selectSpot(spot)}
          />
        ))}

        <div className="user-dot" style={pointStyle(userPoint)} aria-hidden="true">
          <Navigation size={16} fill="currentColor" />
        </div>

        {(
          <div className="map-controls glass-panel" aria-label="Map zoom controls">
            <button type="button" onClick={() => panPlanBy(0, 76)} aria-label="Pan map north" title="Pan map north">
              <ChevronUp size={18} />
            </button>
            <button type="button" onClick={() => panPlanBy(-76, 0)} aria-label="Pan map west" title="Pan map west">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => zoomMapBy(1)} aria-label="Zoom in" title="Zoom in">
              <Plus size={18} />
            </button>
            <button type="button" onClick={() => zoomMapBy(-1)} aria-label="Zoom out" title="Zoom out">
              <Minus size={18} />
            </button>
            <button type="button" onClick={() => panPlanBy(76, 0)} aria-label="Pan map east" title="Pan map east">
              <ChevronRight size={18} />
            </button>
            <button type="button" onClick={() => panPlanBy(0, -76)} aria-label="Pan map south" title="Pan map south">
              <ChevronDown size={18} />
            </button>
            <button className="map-reset" type="button" onClick={resetPlanView} aria-label="Reset map view" title="Reset map view">
              <RotateCcw size={17} />
            </button>
          </div>
        )}

        <header className="topbar glass-panel">
          <div className="topbar-brand">
            <img className="topbar-logo" src="/logo.svg" alt="Old Haunts" />
          </div>
          <div className="status-cluster">
            <button className="icon-button" type="button" onClick={locateUser} aria-label="Locate me">
              <LocateFixed size={19} />
            </button>
            <button
              className="send-context-button"
              type="button"
              onClick={shareCurrentContext}
              aria-label="Send screen"
              title="Send"
            >
              <Share2 size={17} />
              <span>{shareStatus === "copied" ? "Copied" : shareStatus === "sent" ? "Sent" : shareStatus === "failed" ? "Retry" : "Send"}</span>
            </button>
            {account ? (
              <div className="user-menu">
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  aria-label="Account menu"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                >
                  <User size={19} />
                </button>
                {userMenuOpen ? (
                  <>
                    <div className="user-menu-backdrop" onClick={() => setUserMenuOpen(false)} />
                    <div className="user-menu-pop glass-panel" role="menu">
                      {account.signedIn ? (
                        <>
                          <p className="user-menu-email">{account.email}</p>
                          <button
                            type="button"
                            role="menuitem"
                            className="user-menu-item"
                            onClick={() => {
                              account.onSignOut();
                              setUserMenuOpen(false);
                            }}
                          >
                            Sign out
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="user-menu-email">Guest — exploring</p>
                          <button
                            type="button"
                            role="menuitem"
                            className="user-menu-item"
                            onClick={() => {
                              account.onSignIn();
                              setUserMenuOpen(false);
                            }}
                          >
                            Sign in
                          </button>
                        </>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        {selectedId ? (
        <aside className={`spot-dock glass-panel${isListening ? " with-narration" : ""}`}>
          <button
            className="spot-close"
            type="button"
            onClick={() => setSelectedId("")}
            aria-label="Close selected spot"
          >
            <X size={17} />
          </button>
          <div className="dock-heading">
            <span className="dock-icon">
              <MapPin size={17} />
            </span>
            <div>
              <h2>{selectedSpot ? displaySpotTitle(selectedSpot) : ""}</h2>
            </div>
          </div>
          <p className="spot-mood">{selectedSpot ? getCharacter(selectedSpot.id)?.blurb ?? selectedSpot.seed ?? "" : ""}</p>
          {/* Distance bar + "Xm away" only matter while walking up. Once
              unlocked/arrived they're noise, so hide them. */}
          <div className="dock-footer">
            {!selectedUnlocked ? (
              <div className="dock-progress">
                <div className="unlock-meter" aria-hidden="true">
                  <span style={{ width: `${getUnlockPercent(selectedDistance, selectedSpot)}%` }} />
                </div>
                <div className="dock-meta">
                  <span>{Math.round(selectedDistance)}m away</span>
                </div>
              </div>
            ) : (
              <div className="dock-progress" aria-hidden="true" />
            )}
            <button className="primary-button" type="button" onClick={handlePrimaryAction}>
              {selectedCanOpen ? <BookOpen size={17} /> : <Footprints size={17} />}
              {selectedCanOpen ? "Open story" : "Try it"}
            </button>
          </div>
        </aside>
        ) : null}

        {/* Inline daily-memory dock hidden for the demo — memories are viewed
            via the camera FAB (MemoryTab overlay). Keeps the map clean. */}
        {false ? (
        <aside className="memory-dock glass-panel" aria-label="Daily memory stickers">
          <div className="memory-head">
            <div>
              <p className="eyebrow">Daily memory</p>
              <h2>{formatDay(todayKey())}</h2>
            </div>
            <Aperture size={19} />
          </div>
          <div className="sticker-grid">
            {todayMemories.length ? (
              todayMemories.slice(0, 4).map((memory) => (
                <img key={memory.id} src={memory.stickerUrl} alt={memory.caption ?? "Memory sticker"} />
              ))
            ) : (
              <>
                <div className="empty-sticker" aria-hidden="true" />
                <div className="empty-sticker" aria-hidden="true" />
                <div className="empty-sticker" aria-hidden="true" />
                <div className="empty-sticker" aria-hidden="true" />
              </>
            )}
          </div>
          <p className="memory-note">
            {todayMemories.length
              ? "Captured stickers stay in this browser for the demo."
              : "Finish a story challenge to stamp today."}
          </p>
        </aside>
        ) : null}

        {storyMode === "map" ? (
        <div className={`lens-rail-shell${selectedId ? " has-selection" : ""}`} aria-label="Map lenses">
          <div className="lens-rail">
            {LENSES.map((lens) => (
              <button
                key={lens.id}
                className={lens.id === activeLens ? "is-active" : ""}
                type="button"
                onClick={() => chooseLens(lens.id)}
                aria-pressed={lens.id === activeLens}
              >
                <span className="lens-icon" aria-hidden="true">
                  <img src={lens.iconSrc} alt="" />
                </span>
                <span>{lens.label}</span>
                {lens.id === "memories" && memories.length ? <strong>{memories.length}</strong> : null}
              </button>
            ))}
          </div>
          <span className="lens-count" aria-live="polite">
            {sortedVisibleSpots.length} {sortedVisibleSpots.length === 1 ? "pin" : "pins"}
          </span>
        </div>
        ) : null}

        {isListening ? (
          <div className="narration-mini glass-panel" role="region" aria-label="Narration player">
            <span className="narration-mini-pulse" aria-hidden="true">
              <Volume2 size={18} />
            </span>
            <span className="narration-mini-label">{narrationTitle || "Narrating…"}</span>
            <button
              type="button"
              className="narration-mini-toggle"
              onClick={toggleNarrationPause}
              aria-label={narrationPaused ? "Resume narration" : "Pause narration"}
              title={narrationPaused ? "Resume" : "Pause"}
            >
              {narrationPaused ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button
              type="button"
              className="narration-mini-finish"
              onClick={stopNarration}
              aria-label="Finish narration"
              title="Finish"
            >
              <X size={16} />
              Finish
            </button>
          </div>
        ) : null}

        {storyMode !== "map" && currentStory ? (
          <StorySheet
            challengeComplete={Boolean(challengeComplete)}
            isListening={isListening}
            mode={storyMode}
            onAdvanceWalk={advanceWalk}
            onBack={() => {
              setStoryMode("map");
              setCurrentStory(null);
              stopNarration();
            }}
            onChallenge={() => setStoryMode("challenge")}
            onCapturePhoto={handleCapturePhoto}
            onNarrate={narrate}
            onSave={saveMemory}
            story={currentStory}
            capturedPhotoUrl={capturedPhotoUrl}
            walkMeters={walkMeters}
            guideTour={getTourByGuide(currentStory.spotId)}
            onStartTour={(tour: Tour) => {
              stopNarration();
              setStoryMode("map");
              setCurrentStory(null);
              setTourState({ open: true, tourId: tour.id });
            }}
            onStartConvo={setConvoCharacter}
          />
        ) : null}
      </section>
      {showMemoryTab ? <MemoryTab onClose={() => setShowMemoryTab(false)} /> : null}
      {tourState.open ? (
        <TourPlayer initialTourId={tourState.tourId} onClose={() => setTourState({ open: false })} />
      ) : null}
      {convoCharacter ? (
        <ConversationBubble
          character={convoCharacter}
          onClose={() => setConvoCharacter(null)}
        />
      ) : null}
    </main>
  );
}

function StorySheet(props: {
  capturedPhotoUrl: string | null;
  challengeComplete: boolean;
  isListening: boolean;
  mode: StoryMode;
  onAdvanceWalk: () => void;
  onBack: () => void;
  onChallenge: () => void;
  onCapturePhoto: (file: File | null) => void;
  onNarrate: () => void;
  onSave: (kind: "selfie" | "walk") => void;
  story: Story;
  walkMeters: number;
  guideTour?: Tour;
  onStartTour: (tour: Tour) => void;
  /** Opens the floating ConversationBubble for the given character. */
  onStartConvo: (character: Character) => void;
}) {
  const challenge = props.story.challenge;
  const walkTarget = challenge.type === "walk" ? challenge.targetMeters : 0;
  const character = getCharacter(props.story.spotId);

  return (
    <div className="story-scrim">
      <section className="story-sheet glass-panel" aria-label="Story mode">
        {/* ── Header: compact art + identity ── */}
        <div className="story-header">
          <div className="story-art">
            <img
              className="story-art-bust"
              src={`/pins/${props.story.spotId}.png`}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span />
          </div>
          <div className="story-identity">
            <p className="eyebrow">{props.mode === "story" ? "Place story" : "Challenge"}</p>
            <h2>{props.story.title}</h2>
            {character?.era ? <p className="story-era">{character.era}</p> : null}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="story-body">
          {props.mode === "story" ? (
            <>
              <p className="narration">{props.story.narration}</p>
            </>
          ) : (
            <>
              <p className="challenge-copy">{challenge.instruction}</p>
              {challenge.type === "walk" ? (
                <div className="walk-card">
                  <div className="walk-ring">
                    {Math.min(100, Math.round((props.walkMeters / walkTarget) * 100))}%
                  </div>
                  <div>
                    <strong>
                      {Math.round(props.walkMeters)} / {walkTarget}m
                    </strong>
                    <button className="secondary-button compact" type="button" onClick={props.onAdvanceWalk}>
                      <Footprints size={16} />
                      Simulate steps
                    </button>
                  </div>
                </div>
              ) : (
                <div className="camera-card">
                  {props.capturedPhotoUrl ? (
                    <img src={props.capturedPhotoUrl} alt="Captured place detail" />
                  ) : null}
                  <label className="camera-cta">
                    <Aperture size={19} />
                    <span>{props.capturedPhotoUrl ? "Retake photo" : "Open camera"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(event) => props.onCapturePhoto(event.currentTarget.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Pinned action bar — never scrolls off screen ── */}
        <div className="story-action-bar">
          {props.mode === "story" ? (
            <>
              <button className="secondary-button" type="button" onClick={props.onNarrate}>
                <Volume2 size={17} />
                {props.isListening ? "Restart" : "Narrate"}
              </button>
              {character ? (
                <button
                  className="primary-button talk-cta"
                  type="button"
                  onClick={() => props.onStartConvo(character)}
                  aria-label={`Talk to ${character.name.split(" ")[0]}`}
                >
                  <Volume2 size={17} />
                  {`Talk to ${character.name.split(" ")[0]}`}
                </button>
              ) : null}
              <button className="secondary-button" type="button" onClick={props.onChallenge}>
                {challenge.type === "walk" ? <Footprints size={17} /> : <Aperture size={17} />}
                Start challenge
              </button>
              {props.guideTour ? (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => props.onStartTour(props.guideTour!)}
                >
                  <Navigation size={17} />
                  Start tour
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button className="secondary-button" type="button" onClick={props.onBack}>
                Back to map
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={!props.challengeComplete}
                onClick={() => props.onSave(challenge.type)}
              >
                <Sparkles size={17} />
                Save sticker
              </button>
            </>
          )}
        </div>

        <button className="sheet-close" type="button" onClick={props.onBack} aria-label="Close story">
          ×
        </button>
      </section>
    </div>
  );
}

function MapBackdrop() {
  return (
    <svg className="map-backdrop" viewBox="0 0 1000 760" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="cityGrid" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(52,48,42,.09)" strokeWidth="3" />
        </pattern>
      </defs>
      <rect width="1000" height="760" fill="url(#cityGrid)" />
      <path d="M-40 430 C 140 365 253 470 420 410 S 740 302 1045 350" fill="none" stroke="rgba(255,255,255,.76)" strokeWidth="54" strokeLinecap="round" />
      <path d="M-40 430 C 140 365 253 470 420 410 S 740 302 1045 350" fill="none" stroke="rgba(75,139,160,.36)" strokeWidth="38" strokeLinecap="round" />
      <path d="M56 96 C 276 156 474 102 652 34" fill="none" stroke="rgba(53,50,45,.14)" strokeWidth="24" strokeLinecap="round" />
      <path d="M124 684 C 304 548 546 632 818 506" fill="none" stroke="rgba(53,50,45,.12)" strokeWidth="20" strokeLinecap="round" />
    </svg>
  );
}

function createCharacterStory(spot: GhostSpot): Story {
  const character = getCharacter(spot.id);
  const timeOfDay = getTimeOfDay();
  const challenge: Challenge = character?.challenge ?? {
    type: "selfie",
    instruction: "Take a photo to remember standing on this exact spot.",
  };
  const narration = character
    ? `${character.persona}`
    : `You stand where history happened, in the ${timeOfDay} light, and the place begins to speak.`;
  return {
    spotId: spot.id,
    title: character?.name ?? displaySpotTitle(spot),
    narration,
    challenge,
  };
}

function createStickerDataUrl(spot: GhostSpot, kind: "selfie" | "walk", sticker: boolean) {
  const title = displaySpotTitle(spot).split(" ").slice(0, 2).join(" ");
  const glyph = kind === "walk" ? "foot" : "face";
  const bg = sticker ? "#fffdf2" : "#ded8c5";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220">
    <rect width="220" height="220" rx="44" fill="${bg}"/>
    <circle cx="110" cy="104" r="58" fill="#2b2927"/>
    <circle cx="110" cy="104" r="45" fill="#fffef9"/>
    <text x="110" y="112" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#2b2927">${glyph}</text>
    <text x="110" y="202" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#2b2927">${escapeSvg(title)}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

function readMemories(): Memory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Memory[]) : [];
  } catch {
    return [];
  }
}

function readInitialLens(): LensId {
  if (typeof window === "undefined") return "all";
  const raw = new URL(window.location.href).searchParams.get("lens");
  return isLensId(raw) ? raw : "all";
}

function readInitialSpotId(spots: GhostSpot[]) {
  if (typeof window === "undefined") return "";
  const raw = new URL(window.location.href).searchParams.get("spot");
  return raw && spots.some((spot) => spot.id === raw) ? raw : "";
}

function isLensId(value: string | null): value is LensId {
  return Boolean(value && LENSES.some((lens) => lens.id === value));
}

function filterSpotsByLens(spots: GhostSpot[], lens: LensId, memorySpotIds: Set<string>, mapDetail: number) {
  return spots.filter((spot) => {
    const character = getCharacter(spot.id);
    const isObjectSpot = OBJECT_SPOT_IDS.has(spot.id);
    const isBuildingSpot = BUILDING_SPOT_IDS.has(spot.id);
    switch (lens) {
      case "all":
        if (isObjectSpot) return FEATURED_OBJECT_SPOT_IDS.has(spot.id);
        if (isBuildingSpot) return FEATURED_BUILDING_SPOT_IDS.has(spot.id);
        return true;
      case "people":
        return Boolean(character) && !isObjectSpot && !isBuildingSpot;
      case "objects":
        return isObjectSpot;
      case "architecture":
        if (isBuildingSpot) return (BUILDING_DETAIL_RANKS.get(spot.id) ?? 2) <= mapDetail;
        return !isObjectSpot && (spot.icon === "history" || spot.icon === "politics");
      case "moments":
        return !isObjectSpot && !isBuildingSpot && character?.challenge.type === "walk";
      case "culture":
        return !isObjectSpot && !isBuildingSpot && (spot.icon === "arts" || spot.icon === "music" || spot.icon === "literature");
      case "memories":
        return memorySpotIds.has(spot.id);
      default:
        return true;
    }
  });
}

function getMapDetailLevel(adapter: MapRenderer["adapter"] | undefined, planZoom: number, _tick: number) {
  if (adapter?.name === "mapbox-gl") {
    const zoom = adapter.getZoom();
    if (zoom >= 14.05) return 3;
    if (zoom >= 12.85) return 2;
    if (zoom >= 12.25) return 1;
    return 0;
  }
  if (planZoom >= 1.88) return 3;
  if (planZoom >= 1.48) return 2;
  if (planZoom >= 1.18) return 1;
  return 0;
}

function createContextUrl(lens: LensId, selectedId: string, _storyMode: StoryMode) {
  const url = new URL(typeof window !== "undefined" ? window.location.href : "https://grudgemap.local/");
  url.searchParams.set("lens", lens);
  if (selectedId) {
    url.searchParams.set("spot", selectedId);
  } else {
    url.searchParams.delete("spot");
  }
  url.searchParams.delete("screen");
  return url.href;
}

async function copyToClipboard(value: string) {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard unavailable");
  }
  await navigator.clipboard.writeText(value);
}

function getUnlockPercent(distance: number, spot: GhostSpot | undefined) {
  if (!spot) return 0;
  const outer = Math.max(spot.unlockRadius * 5, 180);
  const progress = 100 - (Math.min(distance, outer) / outer) * 100;
  return Math.max(8, Math.min(100, progress));
}

function displaySpotTitle(spot: GhostSpot) {
  return DISPLAY_TITLES[spot.id] ?? spot.title.replace(/^The /, "");
}

function formatDay(day: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${day}T12:00:00`));
}

function pointStyle(point: ScreenPoint) {
  return {
    left: `${point.x}px`,
    top: `${point.y}px`,
  };
}

function planViewStyle(view: PlanMapView) {
  return {
    transform: `translate(${view.offsetX}px, ${view.offsetY}px) scale(${view.zoom})`,
  };
}

function PlacePin({
  spot,
  point,
  isActive,
  hasMemory,
  isSelected,
  onClick,
}: {
  spot: GhostSpot;
  point: ScreenPoint;
  isActive: boolean;
  hasMemory: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <button
      className={`place-pin ${OBJECT_SPOT_IDS.has(spot.id) ? "is-object" : ""} ${BUILDING_SPOT_IDS.has(spot.id) ? "is-building" : ""} ${isActive ? "is-active" : ""} ${hasMemory ? "has-memory" : ""} ${isSelected ? "is-selected" : ""}`}
      style={{
        left: `${point.x}px`,
        top: `${point.y}px`,
        zIndex: isSelected ? 44 : isActive ? 36 : 32,
      }}
      type="button"
      onClick={onClick}
      aria-label={`${displaySpotTitle(spot)} ${isActive ? "unlocked" : "locked"}`}
    >
      {imageFailed ? (
        <>
          <span className="pin-halo" />
          <span className="place-pin-glyph">
            <PinIcon spot={spot} />
          </span>
        </>
      ) : (
        <img
          className="place-pin-bust"
          src={`/pins/${spot.id}.png`}
          alt=""
          draggable={false}
          onError={() => setImageFailed(true)}
        />
      )}
      <span className="pin-name">{displaySpotTitle(spot)}</span>
    </button>
  );
}

// Fan out pins whose projected screen points overlap so dense clusters (the Soho
// figures sit within ~70-280m) stay individually tappable instead of stacking.
function declutterPoints(
  items: Array<{ spot: GhostSpot; point: ScreenPoint }>,
  minDistance = 46
): Map<string, ScreenPoint> {
  const placed: ScreenPoint[] = [];
  const result = new Map<string, ScreenPoint>();
  items.forEach((item, index) => {
    let x = item.point.x;
    let y = item.point.y;
    for (let pass = 0; pass < 16; pass += 1) {
      let collided = false;
      for (const other of placed) {
        const dx = x - other.x;
        const dy = y - other.y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDistance) {
          collided = true;
          const angle = dist > 0.01 ? Math.atan2(dy, dx) : index * 2.39996;
          const push = minDistance - dist + 0.5;
          x += Math.cos(angle) * push;
          y += Math.sin(angle) * push;
        }
      }
      if (!collided) break;
    }
    const resolved = { x, y };
    placed.push(resolved);
    result.set(item.spot.id, resolved);
  });
  return result;
}

function PinIcon({ spot }: { spot: GhostSpot }) {
  const iconProps = { size: 22, strokeWidth: 2.25 };
  switch (spot.icon) {
    case "science":
      return <FlaskConical {...iconProps} />;
    case "music":
      return <Music {...iconProps} />;
    case "politics":
    case "history":
      return <Landmark {...iconProps} />;
    case "arts":
      return <Palette {...iconProps} />;
    case "literature":
      return <BookOpen {...iconProps} />;
    // legacy favorite-spot categories (kept for safety)
    case "coffee":
      return <Coffee {...iconProps} />;
    case "books":
      return <BookOpen {...iconProps} />;
    case "walk":
      return <Footprints {...iconProps} />;
    default:
      return <MapPin {...iconProps} />;
  }
}

function clampPlanOffset(value: number) {
  return Math.max(-520, Math.min(520, value));
}

function isInteractiveTarget(target: EventTarget) {
  return target instanceof HTMLElement
    ? Boolean(target.closest("button, a, input, label, textarea, select, .glass-panel, .lens-rail-shell, .mapbox-layer"))
    : false;
}

function getEnvValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function escapeSvg(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[char] ?? char;
  });
}
