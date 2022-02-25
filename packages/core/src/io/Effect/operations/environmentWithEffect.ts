import { Effect } from "../definition"

/**
 * Effectually accesses the environment of the effect.
 *
 * @tsplus static ets/EffectOps environmentWithEffect
 */
export function environmentWithEffect<R, R0, E, A>(
  f: (env: R0) => Effect<R, E, A>,
  __tsplusTrace?: string
): Effect<R & R0, E, A> {
  return Effect.environment<R0>().flatMap(f)
}