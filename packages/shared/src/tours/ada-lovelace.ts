import type { Tour } from "../tour.js";

export const tour: Tour = {
  id: "ada-lovelace-tour",
  guideId: "ada-lovelace",
  guideName: "Ada Lovelace",
  title: "Ada's Engine: Mathematics, Imagination & the Birth of Computing",
  summary:
    "Walk through Georgian Mayfair and St James's where Ada Lovelace dreamed of analytical machines alongside history's greatest scientific minds.",
  durationMin: 65,
  distanceM: 1850,
  voiceHint: "refined young Englishwoman, quick and analytical, a glint of mischief",
  stops: [
    {
      id: "royal-institution",
      name: "The Royal Institution, Albemarle Street",
      lat: 51.5052,
      lng: -0.1427,
      kind: "historic",
      blurb: "Where Faraday's electromagnetic magic electrified Ada's young mind",
      narration:
        "Here, in these very rooms, I first glimpsed the impossible made visible. Professor Faraday's spinning copper disc—that invisible force rotating it—revealed something profound: nature speaks mathematics, and mathematics might be made mechanical. I was twenty years old and understood in that instant that I was not destined for drawing rooms alone. These experiments showed me the marriage of abstraction and action. My imagination ignited here, irreversibly.",
      walkToNext:
        "150m south down Albemarle Street to Piccadilly",
    },
    {
      id: "fortnum-mason",
      name: "Fortnum & Mason, Piccadilly",
      lat: 51.5045,
      lng: -0.1410,
      kind: "partner",
      blurb:
        "Where Ada took tea amid London's patrons of science and commerce",
      narration:
        "In this very salon, I have sat with learned gentlemen—physicians, mathematicians, railway engineers—over the finest tea London offers. My mother insisted upon these polite encounters; she believed a woman's intellect must be paired with impeccable deportment. The irony was exquisite: I sat demurely, pouring tea, whilst my mind raced through proofs of extraordinary complexity. It was at this very table that Mr. Babbage first sketched his Analytical Engine for me, napkin turning to diagram, my heart quickening with each line.",
      walkToNext:
        "300m southwest toward Green Park",
      partner: {
        venue: "Fortnum & Mason, Piccadilly",
        offer:
          "Exclusive 'Ada's Analytical Blend' tea service with mathematical-themed pastries—£8 for tour walkers",
      },
    },
    {
      id: "green-park",
      name: "Green Park",
      lat: 51.5030,
      lng: -0.1425,
      kind: "historic",
      blurb:
        "Where Ada's solitude became her laboratory for mathematical revolution",
      narration:
        "I walked these paths constantly, escaping the suffocating expectation of parlours and morning calls. Here, beneath these ancient trees, my mind could move freely. It was here I first grasped the profound implication of Babbage's Engine: not merely a mechanical calculator, but a machine capable of manipulating abstract symbols according to pure logic. A mechanical mind. I wept with the recognition of it—that humanity's reasoning could be rendered in brass and wheels, that thought itself could be transmitted and preserved. That a woman's imagination might shape the future.",
      walkToNext:
        "380m northeast through St James's toward St James's Street",
    },
    {
      id: "st-james-street",
      name: "St James's Street",
      lat: 51.5062,
      lng: -0.1375,
      kind: "historic",
      blurb:
        "Where Ada's secret correspondence with Babbage began, hidden from her family",
      narration:
        "In the drawing rooms near this street, London's intellectual elite convened. My correspondence with Mr. Babbage took root here—letters concealed beneath gloves, intercepted before my mother could forbid them. She feared his influence would corrupt my morals or my marriage prospects. How little she understood that his influence gave my life meaning. Here, propriety and possibility collided daily. I wore the mask society demanded whilst my pen raced across paper describing the Analytical Engine's capacity for recursive self-modification—a concept my sex was thought incapable of conceiving.",
      walkToNext:
        "250m west along Piccadilly to Hatchard's",
    },
    {
      id: "hatchard-bookshop",
      name: "Hatchard's Bookshop, Piccadilly",
      lat: 51.5062,
      lng: -0.1395,
      kind: "partner",
      blurb:
        "Ada's sanctuary—where mathematics, philosophy, and poetry converged on the shelves",
      narration:
        "Mr. Hatchard's establishment is my true home. Here, I have traced my fingers along first editions of Newton and Leibniz, losing entire afternoons to their notations. My library is where I live most fully—each volume a conversation across centuries. I came here to study Menabrea's work on the Analytical Engine, annotating every margin, discovering in mechanical design a poetry that rivals Dante or Byron. Books have given me what society would never grant freely: an unguarded mind, permission to think without apology.",
      walkToNext:
        "300m northeast along Piccadilly toward Burlington House",
      partner: {
        venue: "Hatchard's Bookshop, Piccadilly",
        offer:
          "Curated 'Ada's Algorithm' rare mathematics collection—exclusive annotations on calculus texts, £15 credit for walkers",
      },
    },
    {
      id: "burlington-house",
      name: "Burlington House & the Royal Academy",
      lat: 51.5096,
      lng: -0.1402,
      kind: "historic",
      blurb:
        "Where art and science converge—a kingdom Ada could visit but never truly inhabit",
      narration:
        "This institution embodies what I believe: the highest pursuits unite exact science with imagination. Art and mathematics are not opposites but the same impulse differently expressed. Here the brightest minds convene, and I have walked these galleries with quickening heart. Yet as a woman, I could admire but never exhibit. And yet I am sustained by conviction: my work—the first algorithm ever written for a machine—will outlive these arbitrary boundaries. The Engine cares nothing for my sex. Logic is indifferent to gender. Through that indifference lies liberation.",
      walkToNext: undefined,
    },
  ],
};
