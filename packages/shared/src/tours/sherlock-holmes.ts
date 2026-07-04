import type { Tour } from "../tour.js";

export const tour: Tour = {
  id: "sherlock-holmes-tour",
  guideId: "sherlock-holmes",
  guideName: "Sherlock Holmes",
  title: "The Method of Baker Street: Deduction in Marylebone",
  summary:
    "Follow London's most famous detective through Marylebone and Baker Street, where observation becomes deduction and every street corner surrenders its secrets.",
  durationMin: 75,
  distanceM: 1400,
  voiceHint: "crisp, rapid, supremely confident Victorian English deduction",
  stops: [
    {
      id: "221b-baker-street",
      name: "221B Baker Street - The Flat",
      lat: 51.5237,
      lng: -0.1585,
      kind: "historic",
      blurb: "My sitting room; theatre of observation and deduction.",
      narration:
        "You stand before my chambers—seven years I have worked these rooms, conducting the science of detection that lesser minds call luck. Notice the wear upon the Turkish rug: three clients this morning, each footfall distinct. The correspondence pinned to the mantelpiece, the violin in that corner—each element a clue speaking to those who know how to listen. When I am here, the entire criminal underworld telegraphs its movements.",
      walkToNext: "150m west to Baker Street Station, descending to the Metropolitan, Circle, and Northern Lines.",
    },
    {
      id: "baker-street-station",
      name: "Baker Street Station - The Descent",
      lat: 51.5237,
      lng: -0.1595,
      kind: "historic",
      blurb: "Where desperate cases arrive from the city's depths.",
      narration:
        "The Metropolitan, Circle, and Northern Lines converge beneath this street—a perfect anatomy of London's criminal circulation. Observe the ascending faces: anxiety, guilt, desperation. A woman's trembling glove, a man's twice-checked watch. These ascending faces carry mysteries into daylight; I descend into this engine specifically because it reveals human nature stripped bare. Crime flows through London like blood through veins. The astute observer reads the diagnosis at a glance.",
      walkToNext: "400m east through Marylebone Lane to Marylebone High Street.",
    },
    {
      id: "marylebone-high-street",
      name: "Marylebone High Street - The Hunting Ground",
      lat: 51.5220,
      lng: -0.1442,
      kind: "historic",
      blurb: "Where victims, suspects, and secrets converge daily.",
      narration:
        "Study this street carefully. The ironmonger's broken window speaks of theft; the chemist's empty bottles tell of poisoning; the dressmaker's clients wear secret expenditures their husbands will never discover. This is not merely a street—it is a ledger of human transgression written in shop fronts and footsteps. Every transaction leaves traces. Every shopkeeper is a witness. Marylebone High Street teaches those with eyes to see that London's crimes are written in plain view.",
      walkToNext: "150m north to Daunt Books for essential reference material.",
    },
    {
      id: "daunt-books",
      name: "Daunt Books - The Reference Chamber",
      lat: 51.5213,
      lng: -0.1440,
      kind: "partner",
      blurb: "Three floors of monographs, ciphers, and forgotten knowledge.",
      narration:
        "This sanctuary of bound wisdom has served me invaluably. I require monographs on tobacco ash variants, Belgian prison records, the architecture of French cathedrals—knowledge that solves murders. The proprietor understands that a detective's success depends upon reconnaissance through print. A crime committed is merely a puzzle already solved; one needs only the correct reference and the intellectual capacity to apply it. Here, the criminal's entire history waits in dusty volumes.",
      walkToNext: "250m south to St. Marylebone Parish Church.",
      partner: {
        venue: "Daunt Books",
        offer: "Essential detective's research—curated mystery selections and rare criminal histories",
      },
    },
    {
      id: "st-marylebone-church",
      name: "St. Marylebone Parish Church - The Registry",
      lat: 51.5198,
      lng: -0.1502,
      kind: "historic",
      blurb: "Births, deaths, marriages—human identity bound in record.",
      narration:
        "The living conduct their dramas in streets and parlours, but truth resides in registers. How many crimes have dissolved beneath documentary scrutiny? A false aristocrat exposed by baptism records; a murder victim revealed through marriage entry; a conspiracy unravelled by a single death notice. Churches are not spiritual refuges—they are deduction's most reliable ally. Here, the criminal's lies meet the immovable fact of ink and paper. Records never dissemble.",
      walkToNext: "250m north to Portland Place, where pretence accumulates.",
    },
    {
      id: "portland-place",
      name: "Portland Place - The Grand Pretence",
      lat: 51.5206,
      lng: -0.1461,
      kind: "historic",
      blurb: "Elegant Georgian facades conceal elaborate deceptions.",
      narration:
        "These residences shelter Members of Parliament, industrialists, the titled and wealthy. Yet wealth does not purchase virtue, nor does architectural harmony ensure moral order. I have entered more drawing rooms on this street than any other in London—each a theatre where murder assumes the form of parlour drama. The criminals of Portland Place merely possess superior tailoring than their Whitechapel equivalents. The criminal mind operates identically regardless of postal code; only the decor changes.",
      walkToNext: "350m north to Regent's Park, where patterns become visible.",
    },
    {
      id: "regent-park-terrace",
      name: "Regent's Park - The Panorama",
      lat: 51.5273,
      lng: -0.1471,
      kind: "historic",
      blurb: "From elevation, London's architecture of crime emerges.",
      narration:
        "From this height, the apparently random becomes geometric. A murder in Baker Street connects to theft in Marylebone; both lead to fraud in Portland Place. The criminal operates within the same London I now observe from this vantage. My method is elementary: see clearly, record accurately, deduce logically. The city will surrender its secrets to patience, observation, and intellectual rigour. But you must train your eye first. Most people observe; few truly see. That is the difference between Scotland Yard and myself.",
    },
  ],
};
