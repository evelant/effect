import * as Either from "../../Either.ts"
import { dual } from "../../Function.ts"
import * as core from "../../internal/stm/core.ts"
import * as stm from "../../internal/stm/stm.ts"
import * as tRef from "../../internal/stm/tRef.ts"
import * as Option from "../../Option.ts"
import type * as STM from "../../STM.ts"
import type * as TDeferred from "../../TDeferred.ts"
import type * as TRef from "../../TRef.ts"

/** @internal */
const TDeferredSymbolKey = "effect/TDeferred"

/** @internal */
export const TDeferredTypeId: TDeferred.TDeferredTypeId = Symbol.for(
  TDeferredSymbolKey
) as TDeferred.TDeferredTypeId

/** @internal */
const tDeferredVariance = {
  _E: (_: never) => _,
  _A: (_: never) => _
}

/** @internal */
class TDeferredImpl<E, A> implements TDeferred.TDeferred<E, A> {
  readonly [TDeferredTypeId] = tDeferredVariance
  constructor(readonly ref: TRef.TRef<Option.Option<Either.Either<E, A>>>) {}
}

/** @internal */
export const _await = <E, A>(self: TDeferred.TDeferred<E, A>): STM.STM<never, E, A> =>
  stm.flatten(
    stm.collect(tRef.get(self.ref), (option) =>
      Option.isSome(option) ?
        Option.some(stm.fromEither(option.value)) :
        Option.none())
  )

/** @internal */
export const done = dual<
  <E, A>(either: Either.Either<E, A>) => (self: TDeferred.TDeferred<E, A>) => STM.STM<never, never, boolean>,
  <E, A>(self: TDeferred.TDeferred<E, A>, either: Either.Either<E, A>) => STM.STM<never, never, boolean>
>(2, (self, either) =>
  core.flatMap(
    tRef.get(self.ref),
    Option.match({
      onNone: () =>
        core.zipRight(
          tRef.set(self.ref, Option.some(either)),
          core.succeed(true)
        ),
      onSome: () => core.succeed(false)
    })
  ))

/** @internal */
export const fail = dual<
  <E>(error: E) => <A>(self: TDeferred.TDeferred<E, A>) => STM.STM<never, never, boolean>,
  <E, A>(self: TDeferred.TDeferred<E, A>, error: E) => STM.STM<never, never, boolean>
>(2, (self, error) => done(self, Either.left(error)))

/** @internal */
export const make = <E, A>(): STM.STM<never, never, TDeferred.TDeferred<E, A>> =>
  core.map(
    tRef.make<Option.Option<Either.Either<E, A>>>(Option.none()),
    (ref) => new TDeferredImpl(ref)
  )

/** @internal */
export const poll = <E, A>(
  self: TDeferred.TDeferred<E, A>
): STM.STM<never, never, Option.Option<Either.Either<E, A>>> => tRef.get(self.ref)

/** @internal */
export const succeed = dual<
  <A>(value: A) => <E>(self: TDeferred.TDeferred<E, A>) => STM.STM<never, never, boolean>,
  <E, A>(self: TDeferred.TDeferred<E, A>, value: A) => STM.STM<never, never, boolean>
>(2, (self, value) => done(self, Either.right(value)))
