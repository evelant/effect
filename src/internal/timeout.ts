/**
 * Bun currently has a bug where `setTimeout` doesn't behave correctly with a 0ms delay.
 *
 * @see https://github.com/oven-sh/bun/issues/3333
 */

declare const process: any

/** @internal */
export interface Timeout {
  readonly _: unique symbol
}

/** @internal */
const isBun = typeof process === "undefined" ? false : !!((process as any)?.isBun)

/** @internal */
export const clear: (id: Timeout) => void = isBun ? (id) => clearInterval(id as any) : (id) => clearTimeout(id as any)

/** @internal */
export const set: (fn: () => void, ms: number) => Timeout = isBun ?
  (fn: () => void, ms: number) => {
    const id = setInterval(() => {
      fn()
      clearInterval(id)
    }, ms)

    return id as any
  } :
  (fn: () => void, ms: number) => setTimeout(fn, ms)
