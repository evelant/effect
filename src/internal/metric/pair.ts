import type * as MetricKey from "../../MetricKey.ts"
import type * as MetricKeyType from "../../MetricKeyType.ts"
import type * as MetricPair from "../../MetricPair.ts"
import type * as MetricState from "../../MetricState.ts"
import { pipeArguments } from "../../Pipeable.ts"

/** @internal */
const MetricPairSymbolKey = "effect/MetricPair"

/** @internal */
export const MetricPairTypeId: MetricPair.MetricPairTypeId = Symbol.for(
  MetricPairSymbolKey
) as MetricPair.MetricPairTypeId

/** @internal */
const metricPairVariance = {
  _Type: (_: never) => _
}

/** @internal */
export const make = <Type extends MetricKeyType.MetricKeyType<any, any>>(
  metricKey: MetricKey.MetricKey<Type>,
  metricState: MetricState.MetricState<MetricKeyType.MetricKeyType.OutType<Type>>
): MetricPair.MetricPair.Untyped => {
  return {
    [MetricPairTypeId]: metricPairVariance,
    metricKey,
    metricState,
    pipe() {
      return pipeArguments(this, arguments)
    }
  }
}

/** @internal */
export const unsafeMake = <Type extends MetricKeyType.MetricKeyType<any, any>>(
  metricKey: MetricKey.MetricKey<Type>,
  metricState: MetricState.MetricState.Untyped
): MetricPair.MetricPair.Untyped => {
  return {
    [MetricPairTypeId]: metricPairVariance,
    metricKey,
    metricState,
    pipe() {
      return pipeArguments(this, arguments)
    }
  }
}
