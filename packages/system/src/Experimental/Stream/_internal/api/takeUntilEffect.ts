// ets_tracing: off

import * as CK from "../../../../Collections/Immutable/Chunk"
import * as T from "../../../../Effect"
import { pipe } from "../../../../Function"
import type * as C from "../core"
import * as LoopOnPartialChunks from "./loopOnPartialChunks"

/**
 * Takes all elements of the stream until the specified effectual predicate
 * evaluates to `true`.
 */
export function takeUntilEffect_<R, R1, E, E1, A>(
  self: C.Stream<R, E, A>,
  f: (a: A) => T.Effect<R1, E1, boolean>
): C.Stream<R & R1, E | E1, A> {
  return LoopOnPartialChunks.loopOnPartialChunks_(self, (chunk, emit) =>
    pipe(
      T.do,
      T.bind("taken", () =>
        CK.takeWhileM_(chunk, (v) =>
          T.zipRight_(
            emit(v),
            T.map_(f(v), (_) => !_)
          )
        )
      ),
      T.let("last", ({ taken }) => CK.take_(CK.drop_(chunk, CK.size(taken)), 1)),
      T.map(({ last }) => CK.isEmpty(last))
    )
  )
}

/**
 * Takes all elements of the stream until the specified effectual predicate
 * evaluates to `true`.
 *
 * @ets_data_first takeUntilEffect_
 */
export function takeUntilEffect<R1, E1, A>(f: (a: A) => T.Effect<R1, E1, boolean>) {
  return <R, E>(self: C.Stream<R, E, A>) => takeUntilEffect_(self, f)
}