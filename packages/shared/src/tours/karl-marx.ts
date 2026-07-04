import type { Tour } from "../tour.js";

export const tour: Tour = {
  id: "karl-marx-tour",
  guideId: "karl-marx",
  guideName: "Karl Marx",
  title: "Marx's Soho: Exile, Hunger & Das Kapital",
  summary:
    "Walk the few damp streets where a penniless exile buried two children, dodged the landlord, and still wrote the book that shook the world.",
  durationMin: 70,
  distanceM: 1240,
  voiceHint: "deep German-accented man, combative and ironic, booming then conspiratorial",
  stops: [
    {
      id: "red-lion",
      name: "Red Lion, Great Windmill Street",
      lat: 51.5106,
      lng: -0.1342,
      kind: "historic",
      blurb: "Where the Communist League ordered up a Manifesto",
      narration:
        "Here, above this very street, in a sweating upstairs room of the Communist League, they commissioned Engels and me to write a creed. A pamphlet! They wanted a catechism with neat questions and answers. I gave them instead a spectre — haunting Europe, you understand. The ink was barely dry in '48 before the barricades went up across the continent. Not bad, for a tavern in Soho where the beer was warm and the talk was treason.",
      walkToNext: "320m north up Wardour Street, then right into Dean Street",
    },
    {
      id: "dean-street-28",
      name: "28 Dean Street",
      lat: 51.5137,
      lng: -0.1314,
      kind: "historic",
      blurb: "Marx's two cramped rooms, 1851–1856",
      narration:
        "Two small rooms up these stairs — for myself, Jenny, the children, and faithful Lenchen. The Prussian spy who came sniffing reported chaos: broken furniture, dust an inch thick, a fog of tobacco, manuscripts heaped beside the children's toys. He was not wrong. Three of my little ones died in this poverty. And yet on that ruined table I read, I scribbled, I plotted. A man can be crushed by a city and still refuse it the satisfaction.",
      walkToNext: "70m east along Bateman Street to Greek Street, turn left",
    },
    {
      id: "maison-bertaux",
      name: "Maison Bertaux",
      lat: 51.5139,
      lng: -0.1305,
      kind: "partner",
      blurb: "Soho's oldest patisserie — a Communard's coffee stop",
      narration:
        "A French bakery, founded by a Communard fled from Paris after 1871 — my kind of exile entirely! Sit. The pawnbroker has my overcoat and Jenny's silver again, but for the price of a coffee one may be warm and almost respectable. Take the éclair. I spent half my London life starving for principle; you needn't repeat my error. Eat, and consider how the surplus value in that pastry was wrung from the baker's labour.",
      walkToNext: "150m north on Greek Street into Soho Square",
      partner: {
        venue: "Maison Bertaux",
        offer: "Éclair & a coffee for £6 — quote 'the Manifesto'",
      },
    },
    {
      id: "soho-square",
      name: "Soho Square",
      lat: 51.5152,
      lng: -0.1318,
      kind: "historic",
      blurb: "The exile's rare patch of green air",
      narration:
        "A square of grass — luxury, in my Soho. On a Sunday I would march the whole family up to Hampstead Heath, donkeys and roast veal and a bottle of cheap wine, the one day the British Museum kept its doors shut against me. Here I caught my breath between the squalor below and the great dome ahead. Revolution, my friend, is not made only in fury. It is made also by men who insist on a little sunlight.",
      walkToNext: "560m northeast via Soho Street, across Oxford Street, up to Great Russell Street",
    },
    {
      id: "museum-tavern",
      name: "Museum Tavern",
      lat: 51.5188,
      lng: -0.1263,
      kind: "partner",
      blurb: "The pub facing the Museum gates",
      narration:
        "The Museum across the road shuts at last, and a thirsty scholar must restore himself somewhere. This counter, directly opposite those gates, has poured for every dusty exile and dreamer in Bloomsbury. One pint of porter — no more, for there is a chapter still to write and Engels' loyal banknotes do not arrive forever. Lift your glass to the labour that brewed it, then we cross to the place where I made capital confess.",
      walkToNext: "90m: cross Great Russell Street to the British Museum forecourt",
      partner: {
        venue: "Museum Tavern",
        offer: "A pint of London porter & a pork pie, £11",
      },
    },
    {
      id: "british-museum-reading-room",
      name: "British Museum Reading Room",
      lat: 51.5194,
      lng: -0.127,
      kind: "historic",
      blurb: "Under the great dome where Das Kapital took shape",
      narration:
        "Here, under this great blue dome, I sat near enough every day for years — Blue Books, factory inspectors' reports, the dry confessions of the bourgeoisie itself, stacked at my elbow. They let a stateless German read for free; how the British love their liberties when they cost them nothing! And from this silence I built Das Kapital, brick by terrible brick — tracing how your day's labour becomes another man's profit. Sit where I sat, and read until the world looks different.",
    },
  ],
};
