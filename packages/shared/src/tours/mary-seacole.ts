import type { Tour } from "../tour.js";

export const tour: Tour = {
  id: "mary-seacole-tour",
  guideId: "mary-seacole",
  guideName: "Mary Seacole",
  title: "Mary Seacole's Thames: Courage by the River",
  summary:
    "Walk the Lambeth riverside, from the proud bronze statue that faces Parliament to the water's edge, in the company of the Jamaican 'doctress' who nursed the soldiers of the Crimea.",
  durationMin: 45,
  distanceM: 710,
  voiceHint: "warm, confident Jamaican-British woman, motherly and spirited, brooking no nonsense",
  stops: [
    {
      id: "westminster-bridge",
      name: "Westminster Bridge",
      lat: 51.5012,
      lng: -0.1195,
      kind: "historic",
      blurb: "The crossing into the heart of the Empire I served",
      narration:
        "Cross this bridge with me and look across the water to that great Parliament. I was born in Kingston, in Jamaica, daughter of a free black woman who kept a boarding house and taught me the healing arts. I crossed half the world to reach this city — and when I offered my services to nurse the soldiers bound for the Crimea, the War Office turned me away at the door. Was it my age, do you think, or the colour of my skin? No matter. I made up my mind to go to that war on my own account, and so I did.",
      walkToNext: "265m south along the riverside walk to the Mary Seacole statue",
    },
    {
      id: "seacole-statue",
      name: "Mary Seacole Statue, St Thomas' Hospital",
      lat: 51.4989,
      lng: -0.1185,
      kind: "historic",
      blurb: "Britain's first statue honouring a named black woman, facing Parliament",
      narration:
        "And here I stand in bronze at last, three storeys tall, my face set toward the very Parliament that once would not see me. They unveiled me in 2016 — the first statue in this country raised to a named black woman. I confess it makes me smile. I was forgotten for a hundred years after my death, while others took the glory, yet here the truth has out. Plant your feet where mine are cast and remember: a woman may be doubted, dismissed and overlooked, and still march straight into history on her own two feet.",
      walkToNext: "50m to the entrance of St Thomas' Hospital",
    },
    {
      id: "florence-nightingale-museum",
      name: "Florence Nightingale Museum, St Thomas' Hospital",
      lat: 51.4985,
      lng: -0.1188,
      kind: "partner",
      blurb: "The great hospital and the famous rival who shares this riverside",
      narration:
        "It is a fine irony that my statue should rise beside the hospital of Miss Nightingale, the Lady of the Lamp herself. Our paths crossed once in the Crimea, where I asked a night's shelter and was given a corner. The newspapers made her a saint and forgot me entirely — yet the soldiers did not. They called me 'Mother Seacole', and I went out under fire to the very battlefield with my bandages, my lemonade and my good Jamaican remedies. There was room in that dreadful war for more than one brave woman. Step inside and judge our two stories for yourself.",
      walkToNext: "165m south along the Albert Embankment",
      partner: {
        venue: "Florence Nightingale Museum",
        offer: "Discover the women who nursed the Crimea — two rivals, one cause",
      },
    },
    {
      id: "albert-embankment",
      name: "Albert Embankment",
      lat: 51.4972,
      lng: -0.12,
      kind: "historic",
      blurb: "The river path where a tired old soldier-nurse could breathe",
      narration:
        "I came home from the war ruined — bankrupt, you understand, for I had sunk every penny into my British Hotel near Balaclava, feeding and physicking the troops on credit they could not repay. But the soldiers I had nursed did not abandon me. They held a great festival on the banks of the Thames to raise me up again, and the newspapers begged the public not to let Mother Seacole starve. I wrote my own life's tale then — 'Wonderful Adventures in Many Lands' — and it sold and sold. A river like this one always reminded me that the tide turns for those who will not sink.",
      walkToNext: "205m south to Lambeth Palace",
    },
    {
      id: "lambeth-palace",
      name: "Lambeth Palace",
      lat: 51.4954,
      lng: -0.1207,
      kind: "historic",
      blurb: "An ancient seat by the water, looking back on a long, bold life",
      narration:
        "Here at this old palace by the river I will leave you. I lived my last years quietly in London, no longer the bustling 'doctress' of the camps, but content. I had crossed oceans, kept hotels in Panama and the Crimea, tended the cholera and the cannon-wounded, and answered every closed door with my own determined hand. Remember me not as a footnote to a grander name, but as a woman of business and of medicine who served because the suffering needed serving. That, my dear, is a life well spent — and the river rolls on just the same.",
    },
  ],
};
