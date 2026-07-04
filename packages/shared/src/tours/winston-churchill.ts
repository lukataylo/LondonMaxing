import type { Tour } from "../tour.js";

export const tour: Tour = {
  id: "winston-churchill-tour",
  guideId: "winston-churchill",
  guideName: "Winston Churchill",
  title: "Churchill's Whitehall: Leadership Under Fire",
  summary:
    "Walk the corridors of wartime power with Churchill, from the parade ground to the bunker that ran a war.",
  durationMin: 70,
  distanceM: 1300,
  voiceHint: "gravelly resolute older Englishman, defiant, theatrical pauses",
  stops: [
    {
      id: "horse-guards-parade",
      name: "Horse Guards Parade",
      lat: 51.5048,
      lng: -0.1281,
      kind: "historic",
      blurb: "The parade ground beneath the old Admiralty, where it all began",
      narration:
        "Stand here and look up at the Old Admiralty. I held that office twice — once before the last war, once at the start of this one. \"Winston is back,\" the signal flashed to the fleet in 1939, and how my heart leapt. From these windows I watched men drill on this gravel. War is not won on parade grounds, mind you — but resolve is rehearsed here.",
      walkToNext: "150m south along Horse Guards Road to the Downing Street gates",
    },
    {
      id: "no-10-downing-street",
      name: "No. 10 Downing Street",
      lat: 51.5034,
      lng: -0.1276,
      kind: "historic",
      blurb: "The black door behind which a nation's defiance was decided",
      narration:
        "There — the most famous door in England, and for five years my front door. I confess I never much liked the house; draughty, rambling, and a German bomb wrecked the kitchen in '40. So I worked from the Annexe and slept where I could. But it was from this address I broadcast that we would never surrender. I meant every syllable.",
      walkToNext: "200m south down Whitehall to the Cenotaph in the middle of the road",
    },
    {
      id: "the-cenotaph",
      name: "The Cenotaph",
      lat: 51.5031,
      lng: -0.1262,
      kind: "historic",
      blurb: "Lutyens' empty tomb to the war dead, in the middle of Whitehall",
      narration:
        "Pause. Bare your head. Lutyens gave us this — an empty tomb, \"The Glorious Dead,\" no cross, no creed, for every faith fell here. On Armistice Day I have stood at this very kerb while the whole roar of London fell to silence. I sent a generation to the guns in two wars. One never grows accustomed to the arithmetic of it. Never.",
      walkToNext: "80m south along Parliament Street to The Red Lion on your right",
    },
    {
      id: "the-red-lion",
      name: "The Red Lion, Whitehall",
      lat: 51.5027,
      lng: -0.1261,
      kind: "partner",
      blurb: "The division-bell pub where politicians drink within reach of the House",
      narration:
        "A Victorian gin-palace, this, hard by the seat of power — and politicians have wetted their throats here for generations, one ear cocked for the division bell. I shall tell you my own rule on the matter: I have taken more out of alcohol than alcohol has taken out of me. A glass of champagne lifts the spirit and sharpens the wits. Sit. Raise one to the absent.",
      walkToNext: "250m southwest via King Charles Street to Clive Steps and the War Rooms",
      partner: {
        venue: "The Red Lion, Whitehall",
        offer: "A coupe of English sparkling wine, the 'Action This Day' toast",
      },
    },
    {
      id: "churchill-war-rooms",
      name: "Churchill War Rooms (Clive Steps)",
      lat: 51.5021,
      lng: -0.1293,
      kind: "historic",
      blurb: "The underground bunker from which the war was run",
      narration:
        "Down these steps and beneath the pavement lies the bunker. \"This is the room from which I will direct the war,\" I said in the Cabinet Room, and I tapped my chair. We laboured by stale air and bare bulbs while the bombs fell above. The Map Room never slept. Stamped on my own door — \"Action This Day.\" That, more than any speech, was how a war was won.",
      walkToNext: "200m south through the park edge to Parliament Square and my statue",
    },
    {
      id: "churchill-statue-parliament-square",
      name: "Statue of Winston Churchill, Parliament Square",
      lat: 51.5007,
      lng: -0.1268,
      kind: "historic",
      blurb: "Ivor Roberts-Jones' brooding bronze, facing the Commons",
      narration:
        "So this is how they remember me — stooped, scowling, leaning on a stick, glaring across at the Commons. I asked that my statue face Parliament, for that chamber was my true element. They say the sculptor caught my bulldog stoop. I shan't argue. We shape our buildings, and afterwards our buildings shape us. Now I am cast in bronze to brood over the lot of you.",
      walkToNext: "150m east across the road to St Stephen's Tavern, beneath Big Ben",
    },
    {
      id: "st-stephens-tavern",
      name: "St Stephen's Tavern",
      lat: 51.5008,
      lng: -0.1249,
      kind: "partner",
      blurb: "The Members' watering hole in the shadow of the Elizabeth Tower",
      narration:
        "Right under Big Ben — and for a century the favoured haunt of Members slipping out between debates. The same division bell rings here too; many a vote has been cast with the taste of ale still on the lip. I gave my best lines in the House, but I confess the rehearsal often happened over a glass like this. Order something restorative. A statesman must be fed.",
      walkToNext: "150m south to the entrance of Westminster Hall and the Houses of Parliament",
      partner: {
        venue: "St Stephen's Tavern",
        offer: "A pint of cask ale and a plate of pie, the 'Division Bell' lunch",
      },
    },
    {
      id: "westminster-hall",
      name: "Westminster Hall, Houses of Parliament",
      lat: 51.4995,
      lng: -0.1246,
      kind: "historic",
      blurb: "The ancient hall where Churchill lay in state in 1965",
      narration:
        "Here we end, in the oldest hall in the Palace — nine centuries of stone, its hammerbeam roof unbowed though the Commons itself was bombed to rubble around it in 1941. We rebuilt. And in January 1965 I was carried in here to lie in state, while a third of a million of you filed past in the cold and the quiet. Keep faith, and keep buggering on. Goodbye.",
    },
  ],
};
