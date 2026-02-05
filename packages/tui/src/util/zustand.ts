import { create, useStore } from 'zustand'

export function createStore<T extends object>(initial?: T) {
  let initialState = initial ?? ({} as T)

  const store = create<T>(() => initialState)

  return Object.assign(store, {
    current: () => store.getState(),

    update: (partial: Partial<T>) => {
      store.setState(partial)
    },

    explicitUpdate: (partial: Partial<T>) => {
      store.setState(
        {
          ...initialState,
          ...partial
        },
        true
      )
    },

    reset: () => {
      store.setState(initialState ?? ({} as T), true)
    },

    use: <U = T>(selector?: (state: T) => U) => {
      if (selector) {
        return useStore(store, selector)
      }
      return useStore(store, (state) => state as unknown as U)
    }
  })
}
