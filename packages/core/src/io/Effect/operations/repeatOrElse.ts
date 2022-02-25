import type { LazyArg } from "../../../data/Function"
import type { Option } from "../../../data/Option"
import type { HasClock } from "../../Clock"
import type { Schedule } from "../../Schedule"
import type { Effect } from "../definition"

/**
 * Returns a new effect that repeats this effect according to the specified
 * schedule or until the first failure, at which point, the failure value and
 * schedule output are passed to the specified handler.
 *
 * Scheduled recurrences are in addition to the first execution, so that
 * `io.repeat(Schedule.once)` yields an effect that executes `io`, and then if
 * that succeeds, executes `io` an additional time.
 *
 * @tsplus fluent ets/Effect repeatOrElse
 */
export function repeatOrElse_<S, R, E, A, R1, B, R2, E2>(
  self: Effect<R, E, A>,
  schedule: LazyArg<Schedule.WithState<S, R1, A, B>>,
  orElse: (e: E, option: Option<B>) => Effect<R2, E2, B>,
  __tsplusTrace?: string
): Effect<HasClock & R & R1 & R2, E2, B>
export function repeatOrElse_<R, E, A, R1, B, R2, E2>(
  self: Effect<R, E, A>,
  schedule: LazyArg<Schedule<R1, A, B>>,
  orElse: (e: E, option: Option<B>) => Effect<R2, E2, B>,
  __tsplusTrace?: string
): Effect<HasClock & R & R1 & R2, E2, B> {
  return self.repeatOrElseEither(schedule, orElse).map((either) => either.merge())
}

/**
 * Returns a new effect that repeats this effect according to the specified
 * schedule or until the first failure, at which point, the failure value and
 * schedule output are passed to the specified handler.
 *
 * Scheduled recurrences are in addition to the first execution, so that
 * `io.repeat(Schedule.once)` yields an effect that executes `io`, and then if
 * that succeeds, executes `io` an additional time.
 *
 * @ets_data_first repeatOrElse_
 */
export function repeatOrElse<S, R1, A, B, E, R2, E2>(
  schedule: LazyArg<Schedule.WithState<S, R1, A, B>>,
  orElse: (e: E, option: Option<B>) => Effect<R2, E2, B>,
  __tsplusTrace?: string
): <R>(self: Effect<R, E, A>) => Effect<HasClock & R & R1 & R2, E2, B>
export function repeatOrElse<R1, A, B, E, R2, E2>(
  schedule: LazyArg<Schedule<R1, A, B>>,
  orElse: (e: E, option: Option<B>) => Effect<R2, E2, B>,
  __tsplusTrace?: string
) {
  return <R>(self: Effect<R, E, A>): Effect<HasClock & R & R1 & R2, E2, B> =>
    self.repeatOrElse(schedule, orElse)
}