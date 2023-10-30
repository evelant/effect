/**
 * @since 2.0.0
 */
import type * as DefaultServices from "./DefaultServices.ts"
import { pipe } from "./Function.ts"
import * as defaultServices from "./internal/defaultServices.ts"
import * as layer from "./internal/layer.ts"
import type * as Layer from "./Layer.ts"
import * as TestClock from "./TestClock.ts"
import * as TestServices from "./TestServices.ts"

/** @internal */
export const live: Layer.Layer<DefaultServices.DefaultServices, never, TestServices.TestServices> = pipe(
  TestServices.annotationsLayer(),
  layer.merge(TestServices.liveLayer()),
  layer.merge(TestServices.sizedLayer(100)),
  layer.merge(pipe(
    TestServices.liveLayer(),
    layer.merge(TestServices.annotationsLayer()),
    layer.provideMerge(TestClock.defaultTestClock)
  )),
  layer.merge(TestServices.testConfigLayer({ repeats: 100, retries: 100, samples: 200, shrinks: 1000 }))
)

/**
 * @since 2.0.0
 */
export const LiveContext: Layer.Layer<never, never, DefaultServices.DefaultServices> = layer.syncContext(() =>
  defaultServices.liveServices
)

/**
 * @since 2.0.0
 */
export const TestContext: Layer.Layer<never, never, TestServices.TestServices> = layer.provideMerge(LiveContext, live)
