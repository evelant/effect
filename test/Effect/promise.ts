import * as Effect from "effect/Effect"
import * as timeout from "effect/internal/timeout.ts"
import { describe, expect, it } from "vitest"

describe.concurrent("Effect", () => {
  it("promise - success with AbortSignal", async () => {
    let aborted = false
    const effect = Effect.promise<void>((signal) => {
      let handle: any
      signal.addEventListener("abort", () => {
        timeout.clear(handle)
        aborted = true
      })
      return new Promise((resolve) => {
        handle = timeout.set(() => {
          resolve()
        }, 100)
      })
    })
    const program = effect.pipe(
      Effect.timeout("10 millis")
    )
    const exit = await Effect.runPromiseExit(program)
    expect(exit._tag).toBe("Success")
    expect(aborted).toBe(true)
  })
})
