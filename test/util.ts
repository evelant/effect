import * as Data from "effect/Data"
import * as Equal from "effect/Equal"
import type { SuiteAPI } from "vitest"
import { assert, describe } from "vitest"

export const describeNoDeno: SuiteAPI = "Deno" in globalThis ?
  (() => {
  }) as any as SuiteAPI :
  describe

export const assertTrue = (self: boolean) => {
  assert.strictEqual(self, true)
}

export const assertFalse = (self: boolean) => {
  assert.strictEqual(self, false)
}

export const deepStrictEqual = <A>(actual: A, expected: A) => {
  assert.deepStrictEqual(actual, expected)
}

export const strictEqual = <A>(actual: A, expected: A) => {
  assert.strictEqual(actual, expected)
}

export const equalByValue = <A, B>(actual: A, expected: B) => {
  if (Array.isArray(actual) && Array.isArray(expected)) {
    assert.strictEqual(Equal.equals(Data.array(actual), Data.array(expected)), true)
    return
  }
  assert.strictEqual(Equal.equals(actual, expected), true)
}

export const double = (n: number): number => n * 2

export const ownKeys = (o: object): ReadonlyArray<PropertyKey> =>
  (Object.keys(o) as ReadonlyArray<PropertyKey>).concat(Object.getOwnPropertySymbols(o))
