import { Store, type Listener } from '@tanstack/store'

declare module '@tanstack/store' {
  interface Store<TState> {
    get(): TState
  }
}

if (typeof Store.prototype.get !== 'function') {
  Store.prototype.get = function getState(this: Store<unknown>) {
    return this.state
  }
}

const originalSubscribe = Store.prototype.subscribe

Store.prototype.subscribe = function subscribe(
  this: Store<unknown>,
  listener: Listener<unknown>,
) {
  const result = originalSubscribe.call(this, listener)

  if (typeof result === 'function') {
    return { unsubscribe: result }
  }

  return result
} as unknown as typeof Store.prototype.subscribe
