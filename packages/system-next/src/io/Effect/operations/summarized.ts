import * as Tp from "../../../collection/immutable/Tuple"
import { pipe } from "../../../data/Function"
import type { Effect } from "../definition"
import * as Do from "./do"
import { map } from "./map"
import { suspendSucceed } from "./suspendSucceed"

/**
 * Summarizes a effect by computing some value before and after execution, and
 * then combining the values to produce a summary, together with the result of
 * execution.
 *
 * @ets fluent ets/Effect summarized
 */
export function summarized_<R, E, A, R2, E2, B, C>(
  self: Effect<R, E, A>,
  summary: Effect<R2, E2, B>,
  f: (start: B, end: B) => C,
  __etsTrace?: string
): Effect<R & R2, E | E2, Tp.Tuple<[C, A]>> {
  return suspendSucceed(
    () =>
      pipe(
        Do.Do(),
        Do.bind("start", () => summary),
        Do.bind("value", () => self),
        Do.bind("end", () => summary),
        map(({ end, start, value }) => Tp.tuple(f(start, end), value))
      ),
    __etsTrace
  )
}

/**
 * Summarizes a effect by computing some value before and after execution, and
 * then combining the values to produce a summary, together with the result of
 * execution.
 *
 * @ets_data_first summarized_
 */
export function summarized<R2, E2, B, C>(
  summary: Effect<R2, E2, B>,
  f: (start: B, end: B) => C,
  __etsTrace?: string
) {
  return <R, E, A>(self: Effect<R, E, A>): Effect<R & R2, E | E2, Tp.Tuple<[C, A]>> =>
    summarized_(self, summary, f, __etsTrace)
}