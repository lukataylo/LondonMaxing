import type { Tour } from "../tour.js";

export const tour: Tour = {
  id: "jimi-hendrix-tour",
  guideId: "jimi-hendrix",
  guideName: "Jimi Hendrix",
  title: "From Brook Street to the Marquee: Jimi's Swinging London",
  summary: "Walk through Jimi's electric early years in London, from his Mayfair flat to the Soho clubs that made him a legend.",
  durationMin: 60,
  distanceM: 1850,
  voiceHint: "gentle American man, dreamy and unhurried, soft laugh between phrases",
  stops: [
    {
      id: "brook-street-flat",
      name: "23 Brook Street, Mayfair",
      lat: 51.5138,
      lng: -0.1463,
      kind: "historic",
      blurb: "Jimi's cramped flat and first London home.",
      narration:
        "I rented this place in '66—corner room on Brook Street. Every night I'd sit by the window with my Strat, watching rain on these English streets and playing till dawn. The city kept me awake, kept me hungry. Far from home but not lost. That's when I knew London was where I needed to be.",
      walkToNext: "280m northwest to Mount Street and The Claridge's",
    },
    {
      id: "mount-street-cafe",
      name: "The Claridge's Tea Lounge, Mount Street",
      lat: 51.5146,
      lng: -0.1489,
      kind: "partner",
      blurb: "Mayfair's refined afternoon tea and reflection spot.",
      narration:
        "Sometimes I'd slip into the lounge here, order a tea I didn't drink, and just sit. The other guests didn't know who I was—some longhair with callused fingers and paint on his jeans. But the quiet here, the soft clinking of cups, it gave me space to think. Between shows and rehearsals, I'd come here to remember why I loved music before the fame chased me.",
      partner: { venue: "The Claridge's Tea Lounge", offer: "Afternoon tea & slice, exclusive to tour guests" },
      walkToNext: "320m southeast to Kingly Street and Bag O' Nails",
    },
    {
      id: "bag-onails",
      name: "Bag O' Nails, Kingly Street",
      lat: 51.5148,
      lng: -0.1397,
      kind: "historic",
      blurb: "Where Chas Chandler discovered Jimi and changed rock forever.",
      narration:
        "This is where it all happened, right here in this sweaty little club. Chas Chandler walked in one night in '66, saw me play, and told me I'd be bigger than The Beatles. The crowd was packed shoulder-to-shoulder, smell of ale and cigarettes everywhere, and I just felt it—felt the whole room listening with their whole bodies. When Chas believed in me, I started to believe in myself.",
      walkToNext: "240m south down Wardour Street to The Marquee Club",
    },
    {
      id: "the-marquee",
      name: "The Marquee Club, 90 Wardour Street",
      lat: 51.5137,
      lng: -0.1324,
      kind: "historic",
      blurb: "Where Jimi sweated through breakthrough performances night after night.",
      narration:
        "I played this stage more times than I can count. Every night a battle, every night a victory. My amp pushing hard, my fingers finding places on the fretboard I didn't know existed, and the crowd—they were right there with me, feeling it, pushing back. I'd come offstage soaking wet, my shirt stuck to my chest, and I'd think: this is what music is supposed to be. Not polite, not safe. Raw. Alive. Real.",
      walkToNext: "150m northeast to Greek Street and Recordland Soho",
    },
    {
      id: "vinyl-basement",
      name: "Recordland Soho, Greek Street",
      lat: 51.514,
      lng: -0.1315,
      kind: "partner",
      blurb: "Underground record shop where musicians and collectors gathered.",
      narration:
        "I'd wander in here between gigs, my ears still ringing from the stage. The owner knew every record, every pressing, every story. I'd stand there flipping through blues albums—Muddy Waters, Willie Dixon—remembering why I started playing guitar in the first place. In this shop, surrounded by music and vinyl dust, I felt connected to something bigger than myself, something that came before me and would outlast me.",
      partner: { venue: "Recordland Soho", offer: "Vinyl LP & listening session voucher" },
      walkToNext: "200m east to Frith Street and Ronnie Scott's",
    },
    {
      id: "ronnie-scotts",
      name: "Ronnie Scott's, 47 Frith Street",
      lat: 51.5152,
      lng: -0.129,
      kind: "historic",
      blurb: "The pinnacle—where Jimi proved himself among the jazz and blues greats.",
      narration:
        "Walking into Ronnie Scott's felt different. Real legends had played here—people I'd listened to as a kid. When I stepped on this stage, I wasn't just a rock and roller. I was part of something ancient, stretching back through blues and jazz. The audience listened differently. They understood. That's when I knew: the music wasn't just what I did. It was who I was.",
      walkToNext: undefined,
    },
  ],
};
