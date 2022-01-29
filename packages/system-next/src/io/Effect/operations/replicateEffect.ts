import type { Chunk } from "../../../collection/immutable/Chunk/core"
import type { Effect } from "../definition"
import { collectAll } from "./excl-forEach"
import { replicate_ } from "./replicate"
import { suspendSucceed } from "./suspendSucceed"

/**
 * Performs this effect the specified number of times and collects the
 * results.
 *
 * @ets fluent ets/Effect replicateEffect
 */
export function replicateEffect_<R, E, A>(
  self: Effect<R, E, A>,
  n: number,
  __etsTrace?: string
): Effect<R, E, Chunk<A>> {
  return suspendSucceed(() => collectAll(replicate_(self, n)), __etsTrace)
}

/**
 * Performs this effect the specified number of times and collects the
 * results.
 *
 * @ets_data_first replicateEffect_
 */
export function replicateEffect(n: number, __etsTrace?: string) {
  return <R, E, A>(self: Effect<R, E, A>): Effect<R, E, Chunk<A>> =>
    replicateEffect_(self, n, __etsTrace)
}