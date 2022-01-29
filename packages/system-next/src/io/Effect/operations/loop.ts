import * as L from "../../../collection/immutable/List"
import { pipe } from "../../../data/Function"
import type { Effect } from "../definition"
import { chain_ } from "./chain"
import { map, map_ } from "./map"
import { succeed } from "./succeed"
import { suspendSucceed } from "./suspendSucceed"

/**
 * Loops with the specified effectual function, collecting the results into a
 * list. The moral equivalent of:
 *
 * ```typescript
 * let s  = initial
 * let as = [] as readonly A[]
 *
 * while (cont(s)) {
 *   as = [body(s), ...as]
 *   s  = inc(s)
 * }
 *
 * A.reverse(as)
 * ```
 *
 * @ets static ets/EffectOps loop
 */
export function loop<Z>(initial: Z, cont: (z: Z) => boolean, inc: (z: Z) => Z) {
  return <R, E, A>(
    body: (z: Z) => Effect<R, E, A>,
    __etsTrace?: string
  ): Effect<R, E, readonly A[]> => {
    return map_(loopInternal_(initial, cont, inc, body, __etsTrace), (x) =>
      Array.from(L.reverse(x))
    )
  }
}

function loopInternal_<Z, R, E, A>(
  initial: Z,
  cont: (z: Z) => boolean,
  inc: (z: Z) => Z,
  body: (z: Z) => Effect<R, E, A>,
  __etsTrace?: string
): Effect<R, E, L.MutableList<A>> {
  return suspendSucceed(() => {
    if (cont(initial)) {
      return chain_(body(initial), (a) =>
        pipe(
          loopInternal_(inc(initial), cont, inc, body),
          map((as) => {
            L.push_(as, a)
            return as
          })
        )
      )
    }
    return succeed(() => L.emptyPushable())
  }, __etsTrace)
}