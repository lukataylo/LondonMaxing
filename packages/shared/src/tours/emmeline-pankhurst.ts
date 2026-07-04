import type { Tour } from "../tour.js";

export const tour: Tour = {
  id: "emmeline-pankhurst-tour",
  guideId: "emmeline-pankhurst",
  guideName: "Emmeline Pankhurst",
  title: "Votes for Women: The Suffragette War at Westminster",
  summary: "Walk the streets where Emmeline Pankhurst and the WSPU fought their most pivotal battles against Parliament.",
  durationMin: 60,
  distanceM: 1800,
  voiceHint: "passionate, resolute Englishwoman, rousing and defiant",
  stops: [
    {
      id: "caxton-hall",
      name: "Caxton Hall",
      lat: 51.4965,
      lng: -0.1286,
      kind: "historic",
      blurb: "The WSPU's war room: planning, rallies, and defiant action.",
      narration:
        "This hall was our fortress. Here in Caxton Hall, I stood before thousands of women burning with the same fire that burned in me. We plotted our campaigns, held our rallies—some nights the air itself seemed electric with purpose. Every speech from this stage was a battle cry. The very walls absorbed our defiance. We would march from here to Parliament, and no amount of police brutality could silence us.",
      walkToNext: "180m south to Parliament Square, via Caxton Street and Parliament Street."
    },
    {
      id: "parliament-square-south",
      name: "Parliament Square—South Side",
      lat: 51.4994,
      lng: -0.1272,
      kind: "historic",
      blurb: "The symbolic battleground: where we faced down the House that refused us.",
      narration:
        "There it stands—Parliament. For years, I brought our women here, and they met us with lock gates and armed constables. Look at these stones where we've stood, pleaded, sung, been dragged away. When peaceful petition failed, we escalated. We had to make them hear us. This square has seen our processions, our anger, our unwavering courage. Votes for women was not a request—it was a demand written in the blood of their violence.",
      walkToNext: "150m north-east to St Margaret's Church, around the corner."
    },
    {
      id: "st-margaret-church",
      name: "St Margaret's Church",
      lat: 51.4984,
      lng: -0.1244,
      kind: "historic",
      blurb: "Westminster's spiritual heart, where movements were blessed and conscience tested.",
      narration:
        "Even the Church could not escape our question: how could it remain silent on justice? Our women came here for weddings, for funerals, for prayer. Some found their conscience awakened in this stone. When our daughters were imprisoned, beaten, force-fed—yes, force-fed—in their cells, did the clergy speak? We moved forward without their blessing. Truth needs no altar except the human heart.",
      walkToNext: "280m south-west to Victoria Tower Gardens, via Parliament Street and Millbank."
    },
    {
      id: "victoria-tower-gardens",
      name: "Victoria Tower Gardens",
      lat: 51.4947,
      lng: -0.1259,
      kind: "historic",
      blurb: "The memorial to those who gave everything for the cause.",
      narration:
        "This green space holds something sacred for us. Here we honour our heroines—not the famous names, but the factory girls, the chambermaids, the wives who left their homes to fight. Look at this earth. How many times have we gathered here, remembering those who fell in the struggle? Their sacrifice was not romantic—it was real, brutal, necessary. Every woman who chains herself to these railings, who endures the prison, writes herself into history. We did not ask for martyrs. We created revolutionaries.",
      walkToNext: "200m north to the Red Lion pub, via Millbank and Parliament Street."
    },
    {
      id: "red-lion-pub",
      name: "The Red Lion",
      lat: 51.4968,
      lng: -0.1265,
      kind: "partner",
      blurb: "A Westminster watering hole where suffragettes plotted strategy and celebrated victories.",
      narration:
        "Yes, we drank. We laughed. We were not grim fanatics—we were women who knew how to fight and how to rest. In pubs like this, we'd gather after a day of action, comparing bruises from police batons, planning the next escalation. The landlord knew us by name. We spoke freely here—this was our salon, our parliament, where every voice counted equally, unlike the one across the street.",
      partner: {
        venue: "The Red Lion",
        offer: "Historic Westminster ale on tap; ask about our suffragette history exhibit."
      },
      walkToNext: "240m east to Old Palace Yard, via Parliament Street."
    },
    {
      id: "old-palace-yard",
      name: "Old Palace Yard",
      lat: 51.4978,
      lng: -0.1206,
      kind: "historic",
      blurb: "Site of militant action and the raw edge of our campaign.",
      narration:
        "Here, we threw stones at windows. Here, we set fires to buildings. I will not apologize for it. When law fails to hear the voiceless, when petitions are ignored and women are beaten by police for standing silent, what choice remains? These acts were not vandalism—they were a language Parliament finally understood. We broke glass to shatter the silence. And it worked.",
      walkToNext: "320m west to Westminster Abbey, via Parliament Street and Tothill Street."
    },
    {
      id: "westminster-abbey",
      name: "Westminster Abbey",
      lat: 51.4955,
      lng: -0.1274,
      kind: "historic",
      blurb: "The throne of the establishment—and where we demanded our rightful place.",
      narration:
        "Westminster Abbey. Where monarchs are crowned and the powerful are honoured. We stood outside these doors asking: where are the women? Where are we in this history? We are not decoration. We are not subjects. We are citizens demanding representation. I did not live to see women vote—I died in 1928, just before the age of thirty finally disappeared from the requirement. But I died knowing we had won. We had moved the mountain.",
      walkToNext: "160m south-west to Suffragette Memorial Gardens, via Great George Street."
    },
    {
      id: "suffragette-memorial-gardens",
      name: "Suffragette Memorial Gardens",
      lat: 51.4942,
      lng: -0.1280,
      kind: "historic",
      blurb: "Our final gathering place: memory, triumph, and unfinished battles.",
      narration:
        "This is where we gather now—in memory, in victory, in the knowledge that the fight was never truly about that single vote. It was about dignity, about forcing the world to see us as fully human. Some say the battle is won. I say it is never fully won. There are still women fighting, still being silenced, still paying the price for speaking truth. Walk forward knowing what this ground witnessed. We fought here. We bled here. And we changed the world."
    }
  ]
};
