import * as Map from "../../../../collection/immutable/Map"
import { LoggerSet } from "../definition"

export function empty<A>(): LoggerSet<unknown, A> {
  return new LoggerSet(Map.empty)
}