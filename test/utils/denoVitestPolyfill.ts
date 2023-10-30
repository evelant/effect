// @ts-ignore
import * as bdd from "https://deno.land/std@0.202.0/testing/bdd.ts"
// @ts-ignore
import jestExpect from "npm:expect@29.7.0"
// @ts-ignore
import { it as _it } from "https://deno.land/std@0.202.0/testing/bdd.ts"
// @ts-ignore
import { assert as _assert } from "npm:chai@4.3.10"

export const it: any = _it
it.each = (cases: Array<any>) => (name: string, fn: any) => it(name, () => cases.forEach((args) => fn(...args)))

interface Assert {
  (value: any, message?: string): asserts value
  readonly [key: string]: any
}
export const assert: Assert = _assert

export function assertType<T>(value: T): asserts value is T {
}

// @ts-ignore
export * from "https://deno.land/std@0.202.0/testing/bdd.ts"
// @ts-ignore
export { it as test } from "https://deno.land/std@0.202.0/testing/bdd.ts"

// @ts-ignore
export { expectTypeOf } from "npm:expect-type@0.16.0"

export const describe: any = (name: string, fn: any) =>
  bdd.describe(name, {
    sanitizeOps: false,
    sanitizeResources: false
  }, () => fn())
describe.concurrent = describe

export const expect: any = function(value: any) {
  const _ = jestExpect.default(value)
  ;(_ as any).includes = _.toContain
  return _
}

export const vi = new Proxy({}, {
  get(_target, _p, _receiver) {
    throw new Error("Vitest `vi` api is not supported in Deno")
  }
}) as any

export type SuiteAPI = any
export type TestAPI<_S> = any
export type TestOptions = any
