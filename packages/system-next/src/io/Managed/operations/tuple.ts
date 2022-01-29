import type { NonEmptyArray } from "../../../collection/immutable/NonEmptyArray"
import * as Tp from "../../../collection/immutable/Tuple"
import type { _E, _R, ForcedTuple } from "../../../data/Utils"
import type { Managed } from "../definition"
import { collectAll } from "./collectAll"
import { collectAllPar } from "./collectAllPar"
import { map_ } from "./map"
import { withParallelism_ } from "./withParallelism"

export type TupleA<T extends NonEmptyArray<Managed<any, any, any>>> = {
  [K in keyof T]: [T[K]] extends [Managed<any, any, infer A>] ? A : never
}

/**
 * Like `forEach` + `identity` with a tuple type
 */
export function tuple<T extends NonEmptyArray<Managed<any, any, any>>>(
  ...t: T & {
    0: Managed<any, any, any>
  }
): Managed<_R<T[number]>, _E<T[number]>, ForcedTuple<TupleA<T>>> {
  return map_(collectAll(t), (x) => Tp.tuple(...x)) as any
}

/**
 * Like tuple but parallel, same as `forEachPar` + `identity` with a tuple type
 */
export function tuplePar<T extends NonEmptyArray<Managed<any, any, any>>>(
  ...t: T & {
    0: Managed<any, any, any>
  }
): Managed<_R<T[number]>, _E<T[number]>, ForcedTuple<TupleA<T>>> {
  return map_(collectAllPar(t), (x) => Tp.tuple(...x)) as any
}

/**
 * Like tuplePar but uses at most n fibers concurrently,
 * same as `forEachParN` + `identity` with a tuple type
 */
export function tupleParN(n: number): {
  /**
   * @ets_trace call
   */
  <T extends NonEmptyArray<Managed<any, any, any>>>(
    ...t: T & {
      0: Managed<any, any, any>
    }
  ): Managed<_R<T[number]>, _E<T[number]>, ForcedTuple<TupleA<T>>>
} {
  return ((...t: Managed<any, any, any>[]) =>
    map_(withParallelism_(collectAllPar(t), n), (x) => Tp.tuple(...x))) as any
}