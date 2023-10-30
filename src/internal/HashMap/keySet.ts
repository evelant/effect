import type { HashMap } from "../../HashMap.ts"
import type { HashSet } from "../../HashSet.ts"
import { makeImpl } from "../../internal/HashSet.ts"

/** @internal */
export function keySet<K, V>(self: HashMap<K, V>): HashSet<K> {
  return makeImpl(self)
}
