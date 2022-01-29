import * as C from "../src/collection/immutable/Chunk"
import * as Tp from "../src/collection/immutable/Tuple"
import { identity, pipe } from "../src/data/Function"
import type { Has } from "../src/data/Has"
import { tag } from "../src/data/Has"
import * as Clock from "../src/io/Clock"
import * as T from "../src/io/Effect"
import * as Exit from "../src/io/Exit"
import * as Fiber from "../src/io/Fiber"
import * as L from "../src/io/Layer"
import * as M from "../src/io/Managed"
import * as Promise from "../src/io/Promise"
import * as Ref from "../src/io/Ref"

// -----------------------------------------------------------------------------
// Service 1
// -----------------------------------------------------------------------------

const Service1Id = Symbol.for("tests/layer/Service1")

class Service1Impl {
  readonly [Service1Id] = Service1Id
  get one(): T.UIO<number> {
    return T.succeedNow(1)
  }
}

const Service1 = tag<Service1Impl>(Service1Id)

// -----------------------------------------------------------------------------
// Service 2
// -----------------------------------------------------------------------------

const Service2Id = Symbol.for("tests/layer/Service2")

class Service2Impl {
  readonly [Service2Id] = Service2Id
  get two(): T.UIO<number> {
    return T.succeedNow(1)
  }
}

const Service2 = tag<Service2Impl>(Service2Id)

// -----------------------------------------------------------------------------
// Service 3
// -----------------------------------------------------------------------------

const Service3Id = Symbol.for("tests/layer/Service3")

class Service3Impl {
  readonly [Service3Id] = Service3Id
  get three(): T.UIO<number> {
    return T.succeedNow(1)
  }
}

const Service3 = tag<Service3Impl>(Service3Id)

// -----------------------------------------------------------------------------
// Ref
// -----------------------------------------------------------------------------

function makeRef(): T.UIO<Ref.Ref<C.Chunk<string>>> {
  return Ref.make(C.empty())
}

// -----------------------------------------------------------------------------
// Layers
// -----------------------------------------------------------------------------

const acquire1 = "Acquiring Module 1"
const acquire2 = "Acquiring Module 2"
const acquire3 = "Acquiring Module 3"
const release1 = "Releasing Module 1"
const release2 = "Releasing Module 2"
const release3 = "Releasing Module 3"

function makeLayer1(
  ref: Ref.Ref<C.Chunk<string>>
): L.Layer<unknown, never, Has<Service1Impl>> {
  return L.fromManaged(Service1)(
    M.acquireReleaseWith_(
      T.map_(Ref.update_(ref, C.append(acquire1)), () => new Service1Impl()),
      () => Ref.update_(ref, C.append(release1))
    )
  )
}

function makeLayer2(
  ref: Ref.Ref<C.Chunk<string>>
): L.Layer<unknown, never, Has<Service2Impl>> {
  return L.fromManaged(Service2)(
    M.acquireReleaseWith_(
      T.map_(Ref.update_(ref, C.append(acquire2)), () => new Service2Impl()),
      () => Ref.update_(ref, C.append(release2))
    )
  )
}

function makeLayer3(
  ref: Ref.Ref<C.Chunk<string>>
): L.Layer<unknown, never, Has<Service3Impl>> {
  return L.fromManaged(Service3)(
    M.acquireReleaseWith_(
      T.map_(Ref.update_(ref, C.append(acquire3)), () => new Service3Impl()),
      () => Ref.update_(ref, C.append(release3))
    )
  )
}

describe("Layer", () => {
  it("sharing with ++", async () => {
    const expected = [acquire1, release1]

    const { actual } = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer", ({ ref }) => makeLayer1(ref)),
      T.bindValue("env", ({ layer }) => pipe(layer, L.and(layer), L.build)),
      T.tap(({ env }) => M.useDiscard_(env, T.unit)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    expect(C.toArray(actual)).toEqual(expected)
  })

  it("sharing itself with ++", async () => {
    const { m, m1 } = await pipe(
      T.Do(),
      T.bindValue("m", () => new Service1Impl()),
      T.bindValue("layer", ({ m }) => L.fromValue(Service1)(m)),
      T.bindValue("env", ({ layer }) => pipe(layer, L.and(layer), L.and(layer))),
      T.bind("m1", ({ env }) =>
        pipe(
          L.build(env),
          M.use((m) => T.succeedNow(Service1.read(m)))
        )
      ),
      T.unsafeRunPromise
    )

    expect(m).toStrictEqual(m1)
  })

  it("sharing with to", async () => {
    const expected = [acquire1, release1]

    const { actual } = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer", ({ ref }) => makeLayer1(ref)),
      T.bindValue("env", ({ layer }) => pipe(layer, L.to(layer), L.build)),
      T.tap(({ env }) => M.useDiscard_(env, T.unit)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    expect(C.toArray(actual)).toEqual(expected)
  })

  it("sharing with multiple layers", async () => {
    const result = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer1", ({ ref }) => makeLayer1(ref)),
      T.bindValue("layer2", ({ ref }) => makeLayer2(ref)),
      T.bindValue("layer3", ({ ref }) => makeLayer3(ref)),
      T.bindValue("env", ({ layer1, layer2, layer3 }) =>
        pipe(L.to_(layer1, layer2), L.and(L.to_(layer1, layer3)), L.build)
      ),
      T.tap(({ env }) => M.useDiscard_(env, T.unit)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    const actual = C.toArray(result.actual)

    expect(actual[0]).toBe(acquire1)
    expect(actual.slice(1, 3)).toContain(acquire2)
    expect(actual.slice(1, 3)).toContain(acquire3)
    expect(actual.slice(3, 5)).toContain(release2)
    expect(actual.slice(3, 5)).toContain(release3)
    expect(actual[5]).toBe(release1)
  })

  it("finalizers with ++", async () => {
    const result = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer1", ({ ref }) => makeLayer1(ref)),
      T.bindValue("layer2", ({ ref }) => makeLayer2(ref)),
      T.bindValue("env", ({ layer1, layer2 }) => pipe(layer1, L.and(layer2), L.build)),
      T.tap(({ env }) => M.useDiscard_(env, T.unit)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    const actual = C.toArray(result.actual)

    expect(actual.slice(0, 2)).toContain(acquire1)
    expect(actual.slice(0, 2)).toContain(acquire2)
    expect(actual.slice(2, 4)).toContain(release1)
    expect(actual.slice(2, 4)).toContain(release2)
  })

  it("finalizers with to", async () => {
    const { actual } = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer1", ({ ref }) => makeLayer1(ref)),
      T.bindValue("layer2", ({ ref }) => makeLayer2(ref)),
      T.bindValue("env", ({ layer1, layer2 }) => pipe(layer1, L.to(layer2), L.build)),
      T.tap(({ env }) => M.useDiscard_(env, T.unit)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    expect(C.toArray(actual)).toEqual([acquire1, acquire2, release2, release1])
  })

  it("finalizers with multiple layers", async () => {
    const { actual } = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer1", ({ ref }) => makeLayer1(ref)),
      T.bindValue("layer2", ({ ref }) => makeLayer2(ref)),
      T.bindValue("layer3", ({ ref }) => makeLayer3(ref)),
      T.bindValue("env", ({ layer1, layer2, layer3 }) =>
        pipe(layer1, L.to(layer2), L.to(layer3), L.build)
      ),
      T.tap(({ env }) => M.useDiscard_(env, T.unit)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    expect(C.toArray(actual)).toEqual([
      acquire1,
      acquire2,
      acquire3,
      release3,
      release2,
      release1
    ])
  })

  it("map does not interfere with sharing", async () => {
    const result = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer1", ({ ref }) => makeLayer1(ref)),
      T.bindValue("layer2", ({ ref }) => makeLayer2(ref)),
      T.bindValue("layer3", ({ ref }) => makeLayer3(ref)),
      T.bindValue("env", ({ layer1, layer2, layer3 }) => {
        const firstLayer = pipe(layer1, L.map(identity), L.to(layer2))
        const secondLayer = pipe(layer1, L.to(layer3))
        return pipe(firstLayer, L.and(secondLayer), L.build)
      }),
      T.tap(({ env }) => M.useDiscard_(env, T.unit)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    const actual = C.toArray(result.actual)

    expect(actual[0]).toBe(acquire1)
    expect(actual.slice(1, 3)).toContain(acquire2)
    expect(actual.slice(1, 3)).toContain(acquire3)
    expect(actual.slice(3, 5)).toContain(release2)
    expect(actual.slice(3, 5)).toContain(release3)
    expect(actual[5]).toBe(release1)
  })

  it("mapError does not interfere with sharing", async () => {
    const result = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer1", ({ ref }) => makeLayer1(ref)),
      T.bindValue("layer2", ({ ref }) => makeLayer2(ref)),
      T.bindValue("layer3", ({ ref }) => makeLayer3(ref)),
      T.bindValue("env", ({ layer1, layer2, layer3 }) => {
        const firstLayer = pipe(layer1, L.mapError(identity), L.to(layer2))
        const secondLayer = pipe(layer1, L.to(layer3))
        return pipe(firstLayer, L.to(secondLayer), L.build)
      }),
      T.tap(({ env }) => M.useDiscard_(env, T.unit)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    const actual = C.toArray(result.actual)

    expect(actual[0]).toBe(acquire1)
    expect(actual.slice(1, 3)).toContain(acquire2)
    expect(actual.slice(1, 3)).toContain(acquire3)
    expect(actual.slice(3, 5)).toContain(release2)
    expect(actual.slice(3, 5)).toContain(release3)
    expect(actual[5]).toBe(release1)
  })

  it("orDie does not interfere with sharing", async () => {
    const result = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer1", ({ ref }) => makeLayer1(ref)),
      T.bindValue("layer2", ({ ref }) => makeLayer2(ref)),
      T.bindValue("layer3", ({ ref }) => makeLayer3(ref)),
      T.bindValue("env", ({ layer1, layer2, layer3 }) => {
        const firstLayer = pipe(layer1, L.orDie, L.to(layer2))
        const secondLayer = pipe(layer1, L.to(layer3))
        return pipe(firstLayer, L.to(secondLayer), L.build)
      }),
      T.tap(({ env }) => M.useDiscard_(env, T.unit)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    const actual = C.toArray(result.actual)

    expect(actual[0]).toBe(acquire1)
    expect(actual.slice(1, 3)).toContain(acquire2)
    expect(actual.slice(1, 3)).toContain(acquire3)
    expect(actual.slice(3, 5)).toContain(release2)
    expect(actual.slice(3, 5)).toContain(release3)
    expect(actual[5]).toBe(release1)
  })

  it("interruption with ++", async () => {
    const result = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer1", ({ ref }) => makeLayer1(ref)),
      T.bindValue("layer2", ({ ref }) => makeLayer2(ref)),
      T.bindValue("env", ({ layer1, layer2 }) => pipe(layer1, L.and(layer2), L.build)),
      T.bind("fiber", ({ env }) => T.fork(M.useDiscard_(env, T.unit))),
      T.tap(({ fiber }) => Fiber.interrupt(fiber)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    const actual = C.toArray(result.actual)

    if (actual.includes(acquire1)) {
      expect(actual).toContain(release1)
    }
    if (actual.includes(acquire2)) {
      expect(actual).toContain(release2)
    }
  })

  it("interruption with to", async () => {
    const result = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer1", ({ ref }) => makeLayer1(ref)),
      T.bindValue("layer2", ({ ref }) => makeLayer2(ref)),
      T.bindValue("env", ({ layer1, layer2 }) => pipe(layer1, L.to(layer2), L.build)),
      T.bind("fiber", ({ env }) => T.fork(M.useDiscard_(env, T.unit))),
      T.tap(({ fiber }) => Fiber.interrupt(fiber)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    const actual = C.toArray(result.actual)

    if (actual.includes(acquire1)) {
      expect(actual).toContain(release1)
    }
    if (actual.includes(acquire2)) {
      expect(actual).toContain(release2)
    }
  })

  it("interruption with multiple layers", async () => {
    const result = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer1", ({ ref }) => makeLayer1(ref)),
      T.bindValue("layer2", ({ ref }) => makeLayer2(ref)),
      T.bindValue("layer3", ({ ref }) => makeLayer3(ref)),
      T.bindValue("env", ({ layer1, layer2, layer3 }) =>
        pipe(layer1, L.to(layer2), L.and(pipe(layer1, L.to(layer3))), L.build)
      ),
      T.bind("fiber", ({ env }) => T.fork(M.useDiscard_(env, T.unit))),
      T.tap(({ fiber }) => Fiber.interrupt(fiber)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    const actual = C.toArray(result.actual)

    if (actual.includes(acquire1)) {
      expect(actual).toContain(release1)
    }
    if (actual.includes(acquire2)) {
      expect(actual).toContain(release2)
    }
    if (actual.includes(acquire3)) {
      expect(actual).toContain(release3)
    }
  })

  it("layers can be acquired in parallel", async () => {
    const test = pipe(
      T.Do(),
      T.bind("promise", () => Promise.make<never, void>()),
      T.bindValue("layer1", () => L.fromRawManaged(M.never)),
      T.bindValue("layer2", ({ promise }) =>
        pipe(
          Promise.succeed_(promise, undefined),
          M.acquireReleaseWith(() => T.unit),
          L.fromRawManaged,
          L.map((a) => ({ a }))
        )
      ),
      T.bindValue("env", ({ layer1, layer2 }) => pipe(layer1, L.and(layer2), L.build)),
      T.bind("fiber", ({ env }) => T.forkDaemon(M.useDiscard_(env, T.unit))),
      T.tap(({ promise }) => Promise.await(promise)),
      T.tap(({ fiber }) => Fiber.interrupt(fiber)),
      T.map(() => true)
    )

    // Given the use of `Managed.never`, race the test against a 10 second
    // timer and fail the test if the computation doesn't complete. This delay
    // time may be increased if it turns out this test is flaky.
    const result = await pipe(
      T.sleep(10000),
      T.zipRight(T.succeedNow(false)),
      T.race(test),
      T.unsafeRunPromise
    )

    expect(result).toBe(true)
  })

  it("map can map a layer to an unrelated type", async () => {
    const ServiceAId = Symbol()

    class ServiceAImpl {
      readonly [ServiceAId] = ServiceAId
      constructor(readonly name: string, readonly value: number) {}
    }

    const ServiceA = tag<ServiceAImpl>(ServiceAId)

    const ServiceBId = Symbol()

    class ServiceBImpl {
      readonly [ServiceBId] = ServiceBId
      constructor(readonly name: string) {}
    }

    const ServiceB = tag<ServiceBImpl>(ServiceBId)

    const layer1 = L.fromValue(ServiceA)(new ServiceAImpl("name", 1))
    const layer2 = L.fromFunction(ServiceB)(
      (_: ServiceAImpl) => new ServiceBImpl(_.name)
    )

    const live = pipe(layer1, L.map(ServiceA.read), L.to(layer2))

    const result = await pipe(
      T.service(ServiceB),
      T.provideLayer(live),
      T.unsafeRunPromise
    )

    expect(result.name).toBe("name")
  })

  it("memoization", async () => {
    const { actual } = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("memoized", ({ ref }) => L.memoize(makeLayer1(ref))),
      T.tap(({ memoized }) =>
        M.use_(memoized, (layer) =>
          pipe(
            T.environment<Has<Service1Impl>>(),
            T.provideLayer(layer),
            T.chain(() =>
              pipe(T.environment<Has<Service1Impl>>(), T.provideLayer(layer))
            )
          )
        )
      ),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    expect(C.toArray(actual)).toEqual([acquire1, release1])
  })

  it("orElse", async () => {
    const result = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer1", ({ ref }) => makeLayer1(ref)),
      T.bindValue("layer2", ({ ref }) => makeLayer2(ref)),
      T.bindValue("env", ({ layer1, layer2 }) =>
        pipe(layer1, L.to(L.fail("failed!")), L.orElse(layer2), L.build)
      ),
      T.bind("fiber", ({ env }) => M.useDiscard_(env, T.unit)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    const actual = C.toArray(result.actual)

    expect(actual).toEqual([acquire1, release1, acquire2, release2])
  })

  it("passthrough", async () => {
    const NumberServiceId = Symbol()
    interface NumberService {
      readonly value: number
    }
    const NumberService = tag<NumberService>(NumberServiceId)

    const ToStringServiceId = Symbol()
    interface ToStringService {
      readonly value: string
    }
    const ToStringService = tag<ToStringService>(ToStringServiceId)

    const layer = L.fromFunction(ToStringService)((_: Has<NumberService>) => ({
      value: NumberService.read(_).value.toString()
    }))

    const live = L.to_(L.fromValue(NumberService)({ value: 1 }), L.passthrough(layer))

    const { i, s } = await pipe(
      T.Do(),
      T.bind("i", () => T.service(NumberService)),
      T.bind("s", () => T.service(ToStringService)),
      T.provideLayer(live),
      T.unsafeRunPromise
    )

    expect(i.value).toBe(1)
    expect(s.value).toBe("1")
  })

  it("fresh with ++", async () => {
    const { actual } = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer", ({ ref }) => makeLayer1(ref)),
      T.bindValue("env", ({ layer }) => pipe(layer, L.and(L.fresh(layer)), L.build)),
      T.tap(({ env }) => M.useNow(env)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    expect(C.toArray(actual)).toEqual([acquire1, acquire1, release1, release1])
  })

  it("fresh with to", async () => {
    const { actual } = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer", ({ ref }) => makeLayer1(ref)),
      T.bindValue("env", ({ layer }) => pipe(layer, L.to(L.fresh(layer)), L.build)),
      T.tap(({ env }) => M.useNow(env)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    expect(C.toArray(actual)).toEqual([acquire1, acquire1, release1, release1])
  })

  it("fresh with multiple layers", async () => {
    const { actual } = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer", ({ ref }) => makeLayer1(ref)),
      T.bindValue("env", ({ layer }) =>
        pipe(layer, L.and(layer), L.and(L.fresh(L.and_(layer, layer))), L.build)
      ),
      T.tap(({ env }) => M.useNow(env)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    expect(C.toArray(actual)).toEqual([acquire1, acquire1, release1, release1])
  })

  it("fresh with identical fresh layers", async () => {
    const { actual } = await pipe(
      T.Do(),
      T.bind("ref", () => makeRef()),
      T.bindValue("layer1", ({ ref }) => makeLayer1(ref)),
      T.bindValue("layer2", ({ ref }) => makeLayer2(ref)),
      T.bindValue("layer3", ({ ref }) => makeLayer3(ref)),
      T.bindValue("env", ({ layer1, layer2, layer3 }) =>
        pipe(
          L.fresh(layer1),
          L.to(layer2),
          L.and(L.to_(L.fresh(layer1), layer3)),
          L.build
        )
      ),
      T.tap(({ env }) => M.useNow(env)),
      T.bind("actual", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    expect(C.toArray(actual)).toHaveLength(8)
  })

  it("preserves identity of acquired resources", async () => {
    const ChunkServiceId = Symbol()
    const ChunkService = tag<Ref.Ref<C.Chunk<string>>>(ChunkServiceId)

    const { actual } = await pipe(
      T.Do(),
      T.bind("testRef", () => Ref.make<C.Chunk<string>>(C.empty())),
      T.bindValue("layer", ({ testRef }) =>
        pipe(
          Ref.make<C.Chunk<string>>(C.empty()),
          T.toManagedWith((ref) =>
            pipe(
              Ref.get(ref),
              T.chain((_) => Ref.set_(testRef, _))
            )
          ),
          M.tap(() => M.unit),
          L.fromManaged(ChunkService)
        )
      ),
      T.tap(({ layer }) =>
        pipe(
          L.build(layer),
          M.use((_) => pipe(ChunkService.read(_), Ref.update(C.append("test"))))
        )
      ),
      T.bind("actual", ({ testRef }) => Ref.get(testRef)),
      T.unsafeRunPromise
    )

    expect(C.toArray(actual)).toEqual(["test"])
  })

  // TODO: implement after Schedule
  // test("retry") {
  //   for {
  //     ref    <- Ref.make(0)
  //     effect  = ref.update(_ + 1) *> ZIO.fail("fail")
  //     layer   = ZLayer.fromZIOEnvironment(effect).retry(Schedule.recurs(3))
  //     _      <- layer.build.useNow.ignore
  //     result <- ref.get
  //   } yield assert(result)(equalTo(4))
  // },

  it("error handling", async () => {
    const sleep = pipe(
      T.sleep(100),
      T.provideService(Clock.HasClock)(new Clock.LiveClock())
    )
    const layer1 = L.fail("foo")
    const layer2 = L.succeed({ bar: "bar" })
    const layer3 = L.succeed({ baz: "baz" })
    const layer4 = pipe(
      sleep,
      M.acquireReleaseWith(() => sleep),
      M.toLayerRaw,
      L.map((b) => ({ b }))
    )

    const env = pipe(layer1, L.and(pipe(layer2, L.and(layer3), L.andTo(layer4))))

    const result = await pipe(T.unit, T.provideLayer(env), T.exit, T.unsafeRunPromise)

    expect(Exit.isFailure(result)).toBe(true)
  })

  it("project", async () => {
    const PersonServiceId = Symbol()
    const AgeServiceId = Symbol()

    interface PersonService {
      readonly name: string
      readonly age: number
    }

    interface AgeService extends Pick<PersonService, "age"> {}

    const PersonService = tag<PersonService>(PersonServiceId)
    const AgeService = tag<AgeService>(AgeServiceId)

    const personLayer = L.fromValue(PersonService)({ name: "User", age: 42 })
    const ageLayer = pipe(
      personLayer,
      L.project(PersonService, (_) => AgeService.has({ age: _.age }))
    )

    const { age } = await pipe(
      T.service(AgeService),
      T.provideLayer(ageLayer),
      T.unsafeRunPromise
    )

    expect(age).toBe(42)
  })

  it("tap", async () => {
    const BarServiceId = Symbol()

    interface BarService {
      readonly bar: string
    }

    const BarService = tag<BarService>(BarServiceId)

    const { value } = await pipe(
      T.Do(),
      T.bind("ref", () => Ref.make("foo")),
      T.bindValue("layer", ({ ref }) =>
        pipe(
          L.fromValue(BarService)({ bar: "bar" }),
          L.tap((r) => Ref.set_(ref, BarService.read(r).bar))
        )
      ),
      T.tap(({ layer }) => M.useNow(L.build(layer))),
      T.bind("value", ({ ref }) => Ref.get(ref)),
      T.unsafeRunPromise
    )

    expect(value).toBe("bar")
  })

  it("provides a partial environment to an effect", async () => {
    const NumberProviderId = Symbol()
    const NumberProvider = tag<number>(NumberProviderId)

    const StringProviderId = Symbol()
    const StringProvider = tag<string>(StringProviderId)

    const needsNumberAndString = T.environment<Has<number> & Has<string>>()

    const providesNumber = L.fromValue(NumberProvider)(10)
    const providesString = L.fromValue(StringProvider)("hi")

    const needsString = pipe(needsNumberAndString, T.provideSomeLayer(providesNumber))

    const result = await pipe(
      needsString,
      T.provideLayer(providesString),
      T.map((result) =>
        Tp.tuple(NumberProvider.read(result), StringProvider.read(result))
      ),
      T.unsafeRunPromise
    )

    expect(result.get(0)).toBe(10)
    expect(result.get(1)).toBe("hi")
  })

  it("to provides a partial environment to another layer", async () => {
    const StringProviderId = Symbol()

    const StringProvider = tag<string>(StringProviderId)

    const NumberRefProviderId = Symbol()

    const NumberRefProvider = tag<Ref.Ref<number>>(NumberRefProviderId)

    const FooServiceId = Symbol()

    interface FooService {
      readonly ref: Ref.Ref<number>
      readonly string: string
      readonly get: T.UIO<Tp.Tuple<[number, string]>>
    }

    const FooService = tag<FooService>(FooServiceId)

    const fooBuilder = L.map_(
      L.environment<Has<string> & Has<Ref.Ref<number>>>(),
      (_) => {
        const s = StringProvider.read(_)
        const ref = NumberRefProvider.read(_)
        return FooService.has({
          ref,
          string: s,
          get: pipe(
            Ref.get(ref),
            T.map((i) => Tp.tuple(i, s))
          )
        })
      }
    )

    const provideNumberRef = L.fromEffect(NumberRefProvider)(Ref.make(10))
    const provideString = L.fromValue(StringProvider)("hi")
    const needsString = L.to_(provideNumberRef, fooBuilder)
    const layer = L.to_(provideString, needsString)

    const result = await pipe(
      T.serviceWithEffect(FooService)((_) => _.get),
      T.provideLayer(layer),
      T.unsafeRunPromise
    )

    expect(result.get(0)).toBe(10)
    expect(result.get(1)).toBe("hi")
  })

  it(">+> provides a partial environment to another layer", async () => {
    const StringProviderId = Symbol()

    const StringProvider = tag<string>(StringProviderId)

    const NumberRefProviderId = Symbol()

    const NumberRefProvider = tag<Ref.Ref<number>>(NumberRefProviderId)

    const FooServiceId = Symbol()

    interface FooService {
      readonly ref: Ref.Ref<number>
      readonly string: string
      readonly get: T.UIO<Tp.Tuple<[number, string]>>
    }

    const FooService = tag<FooService>(FooServiceId)

    const fooBuilder = L.map_(
      L.environment<Has<string> & Has<Ref.Ref<number>>>(),
      (_) => {
        const s = StringProvider.read(_)
        const ref = NumberRefProvider.read(_)
        return FooService.has({
          ref,
          string: s,
          get: pipe(
            Ref.get(ref),
            T.map((i) => Tp.tuple(i, s))
          )
        })
      }
    )

    const provideNumberRef = L.fromEffect(NumberRefProvider)(Ref.make(10))
    const provideString = L.fromValue(StringProvider)("hi")
    const needsString = pipe(provideNumberRef, L.andTo(fooBuilder))
    const layer = pipe(provideString, L.andTo(needsString))

    const result = await pipe(
      T.serviceWithEffect(FooService)((_) => _.get),
      T.chain(({ tuple: [i1, s] }) =>
        pipe(
          T.serviceWithEffect(NumberRefProvider)((_) => Ref.get(_)),
          T.map((i2) => Tp.tuple(i1, i2, s))
        )
      ),
      T.provideLayer(layer),
      T.unsafeRunPromise
    )

    expect(result.get(0)).toBe(10)
    expect(result.get(1)).toBe(10)
    expect(result.get(2)).toBe("hi")
  })

  it("caching values in dependencies", async () => {
    class Config {
      constructor(readonly value: number) {}
    }

    const AId = Symbol()

    class A {
      constructor(readonly value: number) {}
    }

    const ATag = tag<A>(AId)

    const aLayer = L.fromFunction(ATag)((_: Config) => new A(_.value))

    const BId = Symbol()

    class B {
      constructor(readonly value: number) {}
    }

    const BTag = tag<B>(BId)

    const bLayer = L.fromFunction(BTag)((_: Has<A>) => new B(ATag.read(_).value))

    const CId = Symbol()

    class C {
      constructor(readonly value: number) {}
    }

    const CTag = tag<C>(CId)

    const cLayer = L.fromFunction(CTag)((_: Has<A>) => new C(ATag.read(_).value))

    const fedB = pipe(L.succeed(new Config(1)), L.to(aLayer), L.to(bLayer))
    const fedC = pipe(L.succeed(new Config(2)), L.to(aLayer), L.to(cLayer))

    const result = await pipe(
      fedB,
      L.and(fedC),
      L.build,
      M.useNow,
      T.map((_) => Tp.tuple(BTag.read(_), CTag.read(_))),
      T.unsafeRunPromise
    )

    expect(result.get(0).value).toBe(1)
    expect(result.get(1).value).toBe(1)
  })
})