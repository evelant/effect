/**
 * @since 2.0.0
 */
import type * as Clock from "./Clock.ts"
import type * as ConfigProvider from "./ConfigProvider.ts"
import type * as Console from "./Console.ts"
import type * as Context from "./Context.ts"
import type * as FiberRef from "./FiberRef.ts"
import * as internal from "./internal/defaultServices.ts"
import type * as Random from "./Random.ts"
import type * as Tracer from "./Tracer.ts"

/**
 * @since 2.0.0
 * @category models
 */
export type DefaultServices =
  | Clock.Clock
  | Console.Console
  | Random.Random
  | ConfigProvider.ConfigProvider
  | Tracer.Tracer

/**
 * @since 2.0.0
 * @category constructors
 */
export const liveServices: Context.Context<DefaultServices> = internal.liveServices

/**
 * @since 2.0.0
 * @category fiberRefs
 */
export const currentServices: FiberRef.FiberRef<Context.Context<DefaultServices>> = internal.currentServices
