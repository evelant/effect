import * as St from "@effect-ts/system/Structural"

import * as HM from "../../src/Collections/Immutable/HashMap/index.js"
import { pipe } from "../../src/Function/index.js"

class Key implements St.HasEquals, St.HasHash {
  constructor(readonly n: number) {}

  get [St.hashSym](): number {
    return St.hashNumber(this.n)
  }

  [St.equalsSym](u: unknown): boolean {
    return u instanceof Key && this.n === u.n
  }
}

class Value implements St.HasEquals, St.HasHash {
  constructor(readonly s: string) {}

  get [St.hashSym](): number {
    return St.hashString(this.s)
  }

  [St.equalsSym](u: unknown): boolean {
    return u instanceof Value && this.s === u.s
  }
}

describe("HashMap", () => {
  it("hasHash_", () => {
    expect(
      HM.hasHash_(pipe(HM.make<number, number>(), HM.set(0, 0)), 0, St.hash(0))
    ).toBe(true)
  })
  it("from", () => {
    expect(
      HM.from([
        [1, 2],
        [3, 4]
      ])
    ).toEqual(pipe(HM.make<number, number>(), HM.set(1, 2), HM.set(3, 4)))
  })

  it("hashmapequals", () => {
    const a = HM.from([
      [new Key(0), new Value("a")],
      [new Key(1), new Value("b")]
    ])
    const b = HM.from([
      [new Key(0), new Value("a")],
      [new Key(1), new Value("b")]
    ])

    expect(St.equals(a, b)).toBe(true)
  })
})