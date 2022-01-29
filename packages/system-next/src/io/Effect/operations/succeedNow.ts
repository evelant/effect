import type { Effect } from "../definition"
import { ISucceedNow } from "../definition"

/**
 * Returns an effect that models success with the specified value.
 *
 * @ets static ets/EffectOps succeedNow
 */
export function succeedNow<A>(a: A, __etsTrace?: string): Effect<unknown, never, A> {
  return new ISucceedNow(a, __etsTrace)
}