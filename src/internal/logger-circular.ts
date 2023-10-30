import * as Cause from "../Cause.ts"
import { dual } from "../Function.ts"
import * as HashMap from "../HashMap.ts"
import * as core from "../internal/core.ts"
import * as _fiberId from "../internal/fiberId.ts"
import * as fiberRefs from "../internal/fiberRefs.ts"
import * as List from "../List.ts"
import type * as Logger from "../Logger.ts"

/** @internal */
export const test = dual<
  <Message>(input: Message) => <Output>(self: Logger.Logger<Message, Output>) => Output,
  <Message, Output>(self: Logger.Logger<Message, Output>, input: Message) => Output
>(2, (self, input) =>
  self.log({
    fiberId: _fiberId.none,
    logLevel: core.logLevelInfo,
    message: input,
    cause: Cause.empty,
    context: fiberRefs.empty(),
    spans: List.empty(),
    annotations: HashMap.empty(),
    date: new Date()
  }))
