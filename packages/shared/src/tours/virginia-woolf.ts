import type { Tour } from "../tour.js";

export const tour: Tour = {
  id: "virginia-woolf-tour",
  guideId: "virginia-woolf",
  guideName: "Virginia Woolf",
  title: "Virginia Woolf's Bloomsbury: A Room of One's Own",
  summary:
    "Through the green squares where the Bloomsbury Group was born, a press hummed in a basement, and a woman argued herself into freedom.",
  durationMin: 65,
  distanceM: 1420,
  voiceHint:
    "refined Englishwoman, soft and introspective, delicate spiralling phrasing",
  stops: [
    {
      id: "gordon-square",
      name: "46 Gordon Square",
      lat: 51.524,
      lng: -0.1301,
      kind: "historic",
      blurb: "Where the Bloomsbury Group's Thursday evenings began, 1905",
      narration:
        "Here, at number forty-six, we began. When Father died we fled Kensington's mourning velvet for these plane trees and let the light in at last. Thursday evenings: Thoby's clever friends sprawled till one in the morning, talking of beauty and truth, of nothing and everything, the cocoa going cold. No chaperones, no propriety — only the mind, naked and unhurried. The Bloomsbury Group, I have come to think, was born in this drawing-room, simply because we dared to be honest.",
      walkToNext:
        "150m northeast across Tavistock Square Gardens to the Woolf bust",
    },
    {
      id: "tavistock-square",
      name: "Tavistock Square & 52 Tavistock Square",
      lat: 51.5249,
      lng: -0.1295,
      kind: "historic",
      blurb: "Her bust, the Hogarth Press, and 'A Room of One's Own'",
      narration:
        "They have set my likeness in bronze among these gardens — how strange, to be a head on a plinth, I who lived for the flickering inner life. In the basement of fifty-two the Hogarth Press hummed; I set type with my own inky fingers. Here I wrote Mrs Dalloway, here To the Lighthouse, here, defiantly, A Room of One's Own. Five hundred a year and a door that locks — that, I insisted, is what a woman needs to write. The Blitz took the house. The words remain.",
      walkToNext:
        "About 400m southeast down Bedford Way to the gardens of Russell Square",
    },
    {
      id: "russell-square-cafe",
      name: "Caffè Tropea, Russell Square Gardens",
      lat: 51.5219,
      lng: -0.1254,
      kind: "partner",
      blurb: "A garden café by the fountain for an introspective pause",
      narration:
        "Sit a moment by the fountain. I crossed these gardens daily, and learned that the truest thinking happens not at the desk but on the move, between one square and the next — a sentence assembling itself among the pigeons and the prams. Take your coffee under the planes. Let the mind wander as mine did; the great matters, I find, arrive sideways, while one is pretending to do nothing in particular.",
      walkToNext:
        "300m northeast along Bernard Street to Brunswick Square",
      partner: {
        venue: "Caffè Tropea, Russell Square Gardens",
        offer: "Flat white & a slice of lemon cake, £6.50",
      },
    },
    {
      id: "brunswick-square",
      name: "38 Brunswick Square",
      lat: 51.524,
      lng: -0.1226,
      kind: "historic",
      blurb: "The scandalous communal house, 1911 — and Leonard",
      narration:
        "In 1911 I took rooms in a house here and filled it with men — Maynard Keynes, Duncan Grant, my brother Adrian, and a lodger lately back from Ceylon named Leonard Woolf. Quite improper, an unmarried woman so arranged; we found it marvellously sensible. Meals left on trays, each soul left to its work. Within a year I had married my lodger. The square is much altered now, but I felt my future settle here, quietly, like dust in afternoon sun.",
      walkToNext:
        "200m east along Guilford Street to Mecklenburgh Square",
    },
    {
      id: "mecklenburgh-square",
      name: "37 Mecklenburgh Square",
      lat: 51.5249,
      lng: -0.1196,
      kind: "historic",
      blurb: "Her last London home, bombed in the Blitz, 1939–40",
      narration:
        "Our last London house stood here, behind these railings — we came in 1939, the Press boxed and carted across with us. Then the bombs. One night in September the windows blew in and the ceilings came down; I walked the rubble of my own rooms, my books spilled in the street like fallen birds. I wrote that I felt curiously free, stripped of possessions. The inner life, you see, needs no roof. It was the last square I called home.",
      walkToNext:
        "About 280m south down Doughty Street to Lamb's Conduit Street",
    },
    {
      id: "the-lamb",
      name: "The Lamb, Lamb's Conduit Street",
      lat: 51.5226,
      lng: -0.1185,
      kind: "partner",
      blurb: "A Victorian pub the Bloomsbury set knew well — raise a glass",
      narration:
        "End here, where the gas-lamps and the etched snob-screens have scarcely changed. Our circle knew this pub; one came for the talk as much as the porter, faces half-hidden behind the swivelling glass. Raise something to us — to the squares we filled with argument and affection, to the inner life taken seriously, and to every woman still seeking her five hundred a year and her own locked door. I think we should drink to that. I think we shall.",
      partner: {
        venue: "The Lamb",
        offer: "A pint of London Pride or a glass of house red, £6",
      },
    },
  ],
};
