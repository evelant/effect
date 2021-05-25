import * as C from "../../../Cause"
import * as A from "../../../Collections/Immutable/Chunk"
import * as T from "../../../Effect"
import { _A, _E } from "../../../Effect/commons"
import * as Ex from "../../../Exit"
import * as O from "../../../Option"
import type { Pull } from "./Pull"

/**
 * A `Take<E, A>` represents a single `take` from a queue modeling a stream of
 * values. A `Take` may be a failure cause `Cause<E>`, an chunk value `A`
 * or an end-of-stream marker.
 */
export class Take<E, A> {
  readonly [_E]: () => E;
  readonly [_A]: () => A

  constructor(readonly exit: Ex.Exit<O.Option<E>, A.Chunk<A>>) {}
}

/**
 * Transforms `Take[E, A]` to `Effect[R, E, B]`.
 */
export function done<E, A>(self: Take<E, A>): T.IO<O.Option<E>, A.Chunk<A>> {
  return T.done(self.exit)
}

/**
 * Folds over the failure cause, success value and end-of-stream marker to
 * yield a value.
 */
export function fold_<E, A, Z>(
  self: Take<E, A>,
  end: Z,
  error: (cause: C.Cause<E>) => Z,
  value: (chunk: A.Chunk<A>) => Z
): Z {
  return Ex.fold_(
    self.exit,
    (_) => O.fold_(C.flipCauseOption(_), () => end, error),
    value
  )
}

/**
 * Folds over the failure cause, success value and end-of-stream marker to
 * yield a value.
 *
 * @dataFirst fold_
 */
export function fold<E, A, Z>(
  end: Z,
  error: (cause: C.Cause<E>) => Z,
  value: (chunk: A.Chunk<A>) => Z
) {
  return (self: Take<E, A>) => fold_(self, end, error, value)
}

/**
 * Effectful version of `Take#fold`.
 *
 * Folds over the failure cause, success value and end-of-stream marker to
 * yield an effect.
 */
export function foldM_<R, R1, R2, E, E1, E2, E3, A, Z>(
  self: Take<E, A>,
  end: T.Effect<R, E1, Z>,
  error: (cause: C.Cause<E>) => T.Effect<R1, E2, Z>,
  value: (chunk: A.Chunk<A>) => T.Effect<R2, E3, Z>
): T.Effect<R & R1 & R2, E1 | E2 | E3, Z> {
  return Ex.foldM_(
    self.exit,
    (_): T.Effect<R & R1, E1 | E2, Z> =>
      O.fold_(C.flipCauseOption(_), () => end, error),
    value
  )
}

/**
 * Effectful version of `Take#fold`.
 *
 * Folds over the failure cause, success value and end-of-stream marker to
 * yield an effect.
 *
 * @dataFirst foldM_
 */
export function foldM<R, R1, R2, E, E1, E2, E3, A, Z>(
  end: T.Effect<R, E1, Z>,
  error: (cause: C.Cause<E>) => T.Effect<R1, E2, Z>,
  value: (chunk: A.Chunk<A>) => T.Effect<R2, E3, Z>
) {
  return (self: Take<E, A>) => foldM_(self, end, error, value)
}

/**
 * Checks if this `take` is done (`Take.end`).
 */
export function isDone<E, A>(self: Take<E, A>): boolean {
  return Ex.fold_(
    self.exit,
    (_) => O.isNone(C.flipCauseOption(_)),
    (_) => false
  )
}

/**
 * Checks if this `take` is a failure.
 */
export function isFailure<E, A>(self: Take<E, A>): boolean {
  return Ex.fold_(
    self.exit,
    (_) => O.isSome(C.flipCauseOption(_)),
    (_) => false
  )
}

/**
 * Checks if this `take` is a success.
 */
export function isSuccess<E, A>(self: Take<E, A>): boolean {
  return Ex.fold_(
    self.exit,
    (_) => false,
    (_) => true
  )
}

/**
 * Transforms `Take<E, A>` to `Take<E, B>` by applying function `f`.
 */
export function map_<E, A, B>(self: Take<E, A>, f: (a: A) => B): Take<E, B> {
  return new Take(Ex.map_(self.exit, A.map(f)))
}

/**
 * Transforms `Take<E, A>` to `Take<E, B>` by applying function `f`.
 *
 * @dataFirst map_
 */
export function map<A, B>(f: (a: A) => B) {
  return <E>(self: Take<E, A>) => map_(self, f)
}

/**
 * Returns an effect that effectfully "peeks" at the success of this take.
 */
export function tap_<R, E, E1, A>(
  self: Take<E, A>,
  f: (chunk: A.Chunk<A>) => T.Effect<R, E1, any>
): T.Effect<R, E1, void> {
  return T.asUnit(Ex.forEach_(self.exit, f))
}

/**
 * Returns an effect that effectfully "peeks" at the success of this take.
 *
 * @dataFirst tap_
 */
export function tap<R, E1, A>(f: (chunk: A.Chunk<A>) => T.Effect<R, E1, any>) {
  return <E>(self: Take<E, A>) => tap_(self, f)
}

/**
 * Creates a `Take<never, A>` with a singleton chunk.
 */
export function single<A>(a: A): Take<never, A> {
  return new Take(Ex.succeed(A.single(a)))
}

/**
 * Creates a `Take[Nothing, A]` with the specified chunk.
 */
export function chunk<A>(as: A.Chunk<A>): Take<never, A> {
  return new Take(Ex.succeed(as))
}

/**
 * Creates a failing `Take<E, unknown>` with the specified failure.
 */
export function fail<E>(e: E): Take<E, never> {
  return new Take(Ex.fail(O.some(e)))
}

/**
 * Creates an effect from `Effect<R, E,A>` that does not fail, but succeeds with the `Take<E, A>`.
 * Error from stream when pulling is converted to `Take.halt`. Creates a singleton chunk.
 */
export function fromEffect<R, E, A>(effect: T.Effect<R, E, A>): T.RIO<R, Take<E, A>> {
  return T.foldCause_(effect, (cause) => halt(cause), single)
}

/**
 * Creates effect from `Pull<R, E, A>` that does not fail, but succeeds with the `Take<E, A>`.
 * Error from stream when pulling is converted to `Take.halt`, end of stream to `Take.end`.
 */
export function fromPull<R, E, A>(pull: Pull<R, E, A>): T.RIO<R, Take<E, A>> {
  return T.foldCause_(
    pull,
    (_) => O.fold_(C.flipCauseOption(_), () => end, halt),
    chunk
  )
}

/**
 * Creates a failing `Take<E, never>` with the specified cause.
 */
export function halt<E>(c: C.Cause<E>): Take<E, never> {
  return new Take(Ex.halt(C.map_(c, O.some)))
}

/**
 * Creates a failing `Take<never, never>` with the specified throwable.
 */
export function die<E>(e: E): Take<never, never> {
  return new Take(Ex.die(e))
}

/**
 * Creates a failing `Take<never, never>` with the specified error message.
 */
export function dieMessage(msg: string): Take<never, never> {
  return new Take(Ex.die(new C.RuntimeError(msg)))
}

/**
 * Creates a `Take<E, A>` from `Exit<E, A>`.
 */
export function fromExit<E, A>(exit: Ex.Exit<E, A>): Take<E, A> {
  return new Take(Ex.map_(Ex.mapError_(exit, O.some), A.single))
}

/**
 * End-of-stream marker
 */
export const end: Take<never, never> = new Take(Ex.fail(O.none))
