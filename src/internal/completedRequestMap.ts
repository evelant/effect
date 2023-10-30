import { globalValue } from "../GlobalValue.ts"
import type * as Request from "../Request.ts"
import { fiberRefUnsafeMake } from "./core.ts"

/** @internal */
export const currentRequestMap = globalValue(
  Symbol.for("effect/FiberRef/currentRequestMap"),
  () => fiberRefUnsafeMake(new Map<any, Request.Entry<any>>())
)
