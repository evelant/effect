// ets_tracing: off

import type * as CK from "../../../../Collections/Immutable/Chunk"
import type * as C from "../core"
import * as Chain from "./chain"
import * as FromChunk from "./fromChunk"
import * as FromIterable from "./fromIterable"

/**
 * Creates a stream from an arbitrary number of chunks.
 */
export function fromChunks<O>(...chunks: CK.Chunk<O>[]): C.UIO<O> {
  return Chain.chain_(FromIterable.fromIterable(chunks), (_) => FromChunk.fromChunk(_))
}