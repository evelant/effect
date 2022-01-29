import type { Effect } from "../definition"
import { asUnit } from "./asUnit"
import { chain_ } from "./chain"
import { unit } from "./unit"

// TODO(Mike/Max): Make predicate lazy

/**
 * The moral equivalent of `if (p) exp` when `p` has side-effects.
 *
 * @ets fluent ets/Effect whenEffect
 */
export function whenEffect_<R1, E1, A, R, E>(
  self: Effect<R1, E1, A>,
  predicate: Effect<R, E, boolean>,
  __etsTrace?: string
) {
  return chain_(predicate, (a) => (a ? asUnit(self, __etsTrace) : unit))
}

/**
 * The moral equivalent of `if (p) exp` when `p` has side-effects.
 *
 * @ets_data_first whenEffect_
 */
export function whenEffect<R, E>(
  predicate: Effect<R, E, boolean>,
  __etsTrace?: string
) {
  return <R1, E1, A>(self: Effect<R1, E1, A>) =>
    whenEffect_(self, predicate, __etsTrace)
}