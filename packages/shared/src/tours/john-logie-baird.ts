import type { Tour } from "../tour.js";

export const tour: Tour = {
  id: "john-logie-baird-tour",
  guideId: "john-logie-baird",
  guideName: "John Logie Baird",
  title: "Baird's Soho: The Birth of Television",
  summary:
    "Follow the restless Scots inventor through the back rooms and bohemian streets of Soho, to the very attic where flickering shadows first became a living, moving picture.",
  durationMin: 45,
  distanceM: 720,
  voiceHint: "soft Scottish accent, frail but eager, a tinkerer's quiet excitement breaking through",
  stops: [
    {
      id: "frith-street-22",
      name: "22 Frith Street (Bar Italia)",
      lat: 51.5135,
      lng: -0.1314,
      kind: "historic",
      blurb: "Where the first true television picture flickered into life",
      narration:
        "Up these very stairs, in a cramped attic laboratory, I worked through the long nights of 1925 with my biscuit tins, bicycle lamps, sealing wax and string. On the second of October a dummy's head I called 'Stooky Bill' resolved at last into a real, gradated image — a face with light and shade! I rushed downstairs, dragged up an office boy named William Taynton, and made him the first living person ever televised. Three months later, here in this room, I showed it to the gentlemen of the Royal Institution. The world had its first true television, and it began on Frith Street.",
      walkToNext: "190m north along Frith Street to Soho Square",
    },
    {
      id: "soho-square",
      name: "Soho Square",
      lat: 51.5152,
      lng: -0.1318,
      kind: "historic",
      blurb: "A rare patch of green for a sickly, single-minded inventor",
      narration:
        "I was never a strong man — chilblains, colds, a chest that failed me all my life — so a square of open air like this was a tonic. I would sit and turn the next problem over in my mind: how to send the picture by wire, then by wireless, then across the very Atlantic. They laughed at me, you know, called me a crank with my apparatus of odds and ends. But a quiet bench and a stubborn brain have toppled greater doubts than mine. I dreamed here of pictures flying invisibly through the air into every front room in Britain.",
      walkToNext: "260m south to The French House on Dean Street",
    },
    {
      id: "french-house",
      name: "The French House, 49 Dean Street",
      lat: 51.5129,
      lng: -0.1316,
      kind: "partner",
      blurb: "A Soho bolt-hole for tired hands and a cheap restorative",
      narration:
        "An inventor's purse is forever empty — I pawned and borrowed and lived on next to nothing while the apparatus ate every shilling. A man so engaged still needs somewhere warm to thaw his fingers and steady his nerves. Soho's little bars and cafés kept me human between the soldering and the despair. Sit a moment, take something hot, and pity the poor fellow who must explain to a sceptical investor why his miracle is made of hat-boxes and darning needles. The picture was coming — but a body must be fed.",
      walkToNext: "70m east to Old Compton Street",
      partner: {
        venue: "The French House",
        offer: "A glass of something restorative — toast the inventor of television",
      },
    },
    {
      id: "old-compton-street",
      name: "Old Compton Street",
      lat: 51.5131,
      lng: -0.1306,
      kind: "historic",
      blurb: "The bustling spine of bohemian Soho",
      narration:
        "Soho in my day teemed with strivers and dreamers — tailors, watchmakers, foreign cooks, artists without a penny. I was one more eccentric among them, hurrying through with parcels of lenses and selenium cells under my arm. The shopkeepers knew me as the queer Scotsman building a machine to see by wireless. There is no better soil for invention than a street full of clever, hungry, hopeful people. Every great thing I made was stitched together from this district's cast-offs and its restless, electric air.",
      walkToNext: "170m west to Wardour Street",
    },
    {
      id: "wardour-street",
      name: "Wardour Street",
      lat: 51.5133,
      lng: -0.133,
      kind: "historic",
      blurb: "Soho's street of moving pictures, where my invention found its future",
      narration:
        "This street of film and moving pictures is where my child grew up. I had given the world the means to send a moving image through the air, and it was the showmen and the broadcasters who would carry it into millions of homes. My mechanical system was overtaken in the end by the electronic — that is the fate of every pioneer, to light the way and then be passed upon the road. Yet remember this: every screen that glows in every parlour traces back to a tinkerer's attic a few hundred yards from where you stand. I called it television, and so it remains.",
    },
  ],
};
