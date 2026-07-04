import type { Tour } from "../tour.js";
import { tour as karlMarx } from "./karl-marx.js";
import { tour as winstonChurchill } from "./winston-churchill.js";
import { tour as charlesDickens } from "./charles-dickens.js";
import { tour as virginiaWoolf } from "./virginia-woolf.js";
import { tour as sherlockHolmes } from "./sherlock-holmes.js";
import { tour as adaLovelace } from "./ada-lovelace.js";
import { tour as jimiHendrix } from "./jimi-hendrix.js";
import { tour as samuelJohnson } from "./samuel-johnson.js";
import { tour as christopherWren } from "./christopher-wren.js";
import { tour as emmelinePankhurst } from "./emmeline-pankhurst.js";
import { tour as johnLogieBaird } from "./john-logie-baird.js";
import { tour as marySeacole } from "./mary-seacole.js";

/** All pre-generated guided tours. */
export const TOURS: Tour[] = [
  karlMarx,
  winstonChurchill,
  charlesDickens,
  virginiaWoolf,
  sherlockHolmes,
  adaLovelace,
  jimiHendrix,
  samuelJohnson,
  christopherWren,
  emmelinePankhurst,
  johnLogieBaird,
  marySeacole,
];

export function getTour(id: string): Tour | undefined {
  return TOURS.find((t) => t.id === id);
}

export function getTourByGuide(guideId: string): Tour | undefined {
  return TOURS.find((t) => t.guideId === guideId);
}
