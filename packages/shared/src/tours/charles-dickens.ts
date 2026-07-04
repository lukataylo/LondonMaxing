import type { Tour } from "../tour.js";

export const tour: Tour = {
  id: "charles-dickens-tour",
  guideId: "charles-dickens",
  guideName: "Charles Dickens",
  title: "Dickens's London Underside: Fog, Foundlings & the Inns of Court",
  summary:
    "Walk Bloomsbury and the Inns of Court with Dickens, from a hospital for abandoned children to the fog-bound courts that swallowed the poor.",
  durationMin: 75,
  distanceM: 1480,
  voiceHint: "energetic Victorian Englishman, theatrical, rapid and vivid",
  stops: [
    {
      id: "foundling",
      name: "Coram's Fields & the Foundling Hospital",
      lat: 51.5247,
      lng: -0.1222,
      kind: "historic",
      blurb: "Where abandoned infants were taken in — Dickens's lifelong obsession",
      narration:
        "Here once stood the Foundling Hospital, where mothers with nothing left to give surrendered their infants to Captain Coram's charity. I worshipped in its chapel of a Sunday, and kept a pew close by. The forsaken child haunted me all my days — I christened poor Tattycoram, in Little Dorrit, after this very ground. Look through these railings: only children may enter now. We begin here, where London's smallest, most forgotten souls were merely kept alive.",
      walkToNext: "About 410m east along Guilford Street, then right into Doughty Street.",
    },
    {
      id: "doughty-street",
      name: "48 Doughty Street",
      lat: 51.5236,
      lng: -0.1166,
      kind: "historic",
      blurb: "His only surviving London home, where he wrote Oliver Twist",
      narration:
        "Number forty-eight — my first proper house, taken when fame came roaring in with Pickwick. In these rooms I wrote of Oliver daring to ask for more, and Nicholas Nickleby's half-starved schoolboys. But sorrow lodged here too: my dear sister-in-law Mary, but seventeen, died in my arms upon that very staircase. I wore her ring until my own last day. Joy and grief beneath one roof — that, reader, is the whole of a life.",
      walkToNext: "150m south down Doughty Street to the corner of Northington Street.",
    },
    {
      id: "lady-ottoline",
      name: "The Lady Ottoline",
      lat: 51.5228,
      lng: -0.1149,
      kind: "partner",
      blurb: "A Bloomsbury tavern pause — restoration before the dark courts",
      narration:
        "A writer must be fed, and the law-clerk I once was knew every chop-house in Bloomsbury. Pause here, as I should, for a restorative. In my day it was porter and a hot pie at the corner tavern; the imagination, I do assure you, runs on victuals quite as much as on ink. Take your ease at this snug house — the Inns of Court, and considerably darker matters, await us a little further down the hill.",
      walkToNext: "About 420m south along Gray's Inn Road and into Gray's Inn, to South Square.",
      partner: {
        venue: "The Lady Ottoline, Northington Street",
        offer: "A pot of tea and a slice of pork pie, £6 for tour walkers",
      },
    },
    {
      id: "grays-inn",
      name: "Gray's Inn (South Square)",
      lat: 51.5186,
      lng: -0.1107,
      kind: "historic",
      blurb: "Where teenage Dickens toiled as an inky law clerk",
      narration:
        "At fifteen I was a copying-clerk hereabouts, inky and underpaid, at Ellis and Blackmore. I once called Gray's Inn one of the most depressing institutions in brick and mortar known to the children of men — and I meant every syllable. Yet I learned the law's cruelty here: its endless delays that bleed the poor man white. Every villainous attorney I ever set loose in a novel was first hatched in a dim chamber such as these.",
      walkToNext: "Cross High Holborn, about 80m south, to the timbered front of Staple Inn.",
    },
    {
      id: "staple-inn",
      name: "Staple Inn, High Holborn",
      lat: 51.5179,
      lng: -0.1109,
      kind: "historic",
      blurb: "Tudor survivor that sheltered Mr Grewgious in Edwin Drood",
      narration:
        "Behold this Tudor frontage — crooked, soot-blackened, and miraculously spared the wrecker's hammer. I lodged Mr Grewgious within Staple Inn in my last, unfinished tale, Edwin Drood, conjuring a place where a few smoky sparrows twitter and the city's roar softens to a hum. Step through the low arch into the hush of the court: here old London still draws breath, holding her secrets close. My own story ended before Drood's could be told.",
      walkToNext: "About 220m southwest, down toward Lincoln's Inn and Old Square.",
    },
    {
      id: "lincolns-inn",
      name: "Lincoln's Inn, Old Square",
      lat: 51.5163,
      lng: -0.1128,
      kind: "historic",
      blurb: "The Court of Chancery — Bleak House's fog and ruinous delay",
      narration:
        "Fog everywhere. Fog up the river, fog down the river — so I opened Bleak House, and the densest fog of all sat here, in the Court of Chancery at Lincoln's Inn Hall. Jarndyce and Jarndyce dragged on so long that whole lives were swallowed whole by lawyers' fees, and forgotten. I watched true suits do precisely the same. The law, dear friend, can prove the cruellest workhouse of them all.",
      walkToNext: "About 200m south, through to Carey Street, to the Seven Stars.",
    },
    {
      id: "seven-stars",
      name: "The Seven Stars, Carey Street",
      lat: 51.5146,
      lng: -0.1136,
      kind: "partner",
      blurb: "A 1602 lawyers' tavern — a fitting end to our dark wander",
      narration:
        "And so we end where the law's foot-soldiers slake their thirst — this little tavern has poured for barristers since before the Great Fire itself. Raise a glass with me. I have shown you fog and foundlings, debtors and dim chambers, the whole bruised underside of my glittering city. Remember this: behind every cheerful tale I ever told, a forgotten child was tugging hard at my sleeve. Good night to you — and God bless us, every one.",
      partner: {
        venue: "The Seven Stars, Carey Street",
        offer: "A pint of porter and a plate of cheese for two, £12",
      },
    },
  ],
};
