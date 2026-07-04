import type { Tour } from "../tour.js";

export const tour: Tour = {
  id: "samuel-johnson-tour",
  guideId: "samuel-johnson",
  guideName: "Samuel Johnson",
  title: "The Dictionary Begins: Samuel Johnson's Fleet Street",
  summary: "Walk where Samuel Johnson gathered words, drank coffee, and changed English forever—from bustling Fleet Street to the quiet study at Gough Square.",
  durationMin: 55,
  distanceM: 730,
  voiceHint: "older Englishman, gruff and authoritative, rolling 18th-century cadence",
  stops: [
    {
      id: "fleet-street",
      name: "Fleet Street",
      lat: 51.5138,
      lng: -0.1094,
      kind: "historic",
      blurb: "The heart of London's printing and coffee-house world",
      narration: "Here I stand upon the very spine of London's literary commerce. Fleet Street—where every press rattles with the news of the day, where scribblers and booksellers jostle for fortune. In these streets walked men of letters. We gathered in coffee houses, debated, wagered, and schemed. This was the beating heart where language itself was bought and sold, where fortunes rose and fell upon the turn of a phrase. Come, let me show you where we made our mark upon the English tongue.",
      walkToNext: "150m north along Gough Passage to Gough Square"
    },
    {
      id: "gough-square",
      name: "Gough Square",
      lat: 51.5153,
      lng: -0.1074,
      kind: "historic",
      blurb: "Where Johnson lived and created his monumental Dictionary",
      narration: "Seventeen years I laboured here, in those rooms above this square, with my scribes about me, reading, marking, defining. Every word of English that mattered passed through these hands. The Dictionary—my great work, though it aged me considerably. The weight of a nation's language upon one's shoulders is not light. Here, surrounded by papers and ink, slips scattered like snow, I bent to the task of ordering chaos itself, of fixing words for all posterity. This room was my kingdom.",
      walkToNext: "200m south-west along Gough Street to The Cheshire Cheese"
    },
    {
      id: "cheshire-cheese",
      name: "The Cheshire Cheese",
      lat: 51.5142,
      lng: -0.1097,
      kind: "partner",
      blurb: "Where Johnson and Boswell drank and debated late into night",
      narration: "When the work grew heavy, I would come here to this ancient tavern in Wine Office Court, to escape the narrow confines of my desk. Here the talk flowed as freely as the ale—politics, literature, the nature of man and God. It is said that a good tavern is more instructive than a mediocre book. I came here to think, to argue with men of sense, to remember that a man is not merely a labouring machine, but a social creature. The best of my wit was sharpened here.",
      walkToNext: "280m south-west to Middle Temple",
      partner: {
        venue: "The Cheshire Cheese",
        offer: "Traditional 18th-century ale and Johnson's table—conversation guaranteed"
      }
    },
    {
      id: "middle-temple",
      name: "Middle Temple",
      lat: 51.5135,
      lng: -0.1147,
      kind: "historic",
      blurb: "The Inns of Court: ancient halls of learning and law",
      narration: "The Inns of Court—these ancient sanctuaries of learning and law, where order is imposed upon human dispute. My own education took me through halls like these, and here I knew many lawyers and scholars. Though I did not myself practise law, I understood that the law and language are sisters: both seek to impose order upon the chaos of human nature. The quiet courtyards here provided refuge, spaces for contemplation between my dictionary labours and the clamour of the streets above.",
      walkToNext: "120m north-east toward The Temple Church"
    },
    {
      id: "temple-church",
      name: "The Temple Church",
      lat: 51.5145,
      lng: -0.1142,
      kind: "historic",
      blurb: "Ancient sanctuary: where the soul finds rest from endless words",
      narration: "This ancient church stands at the heart of the Inns of Court, a place of prayer and reflection older than most of our modern pretensions. I came here sometimes to sit in silence, away from the endless business of words—to kneel before something greater than dictionary-making. A man of letters must not forget the soul, the spiritual foundation beneath all our clever compositions. The rounded nave, built by the Knights Templar themselves, reminds us that some truths are older and deeper than any dictionary can capture."
    }
  ]
};
