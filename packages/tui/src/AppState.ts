import z from 'zod'
import { createStore } from './util/zustand'
import type { SelectOption } from '@opentui/core'
import { runCommandThenClose } from '.'

export type PackageDependency = {
  name: string
  version: string
  type: 'HARD' | 'DEV' | 'PEER'
}

type PackageScript = {
  name: string
  content: string
}

const AppViews = ['Main', 'Add Package', 'Remove Package', 'List Packages', 'Run Script'] as const
export type AppView = (typeof AppViews)[number]

type AppState = {
  dependencies: PackageDependency[]
  scripts: PackageScript[]
  view: AppView
}

const Store = createStore<AppState>({
  dependencies: [],
  scripts: [],
  view: 'Main'
})

const setView = (newView: AppView) => {
  Store.update({
    view: newView
  })
}

const getOptions = (): SelectOption[] => {
  const { view, dependencies, scripts } = Store.current()
  switch (view) {
    case 'Main':
      return AppViews.map((v) => {
        return {
          name: v,
          description: ''
        }
      }).filter((v) => v.name !== 'Main')
    case 'Add Package':
      // Add package doesn't display a list
      return []
    case 'Remove Package':
    case 'List Packages':
      return dependencies.map((d) => {
        return {
          name: `${d.name}`,
          description: `${d.type} - ${d.version}`
        }
      })
    case 'Run Script':
      return scripts.map((s) => {
        return {
          name: s.name,
          description: s.content
        }
      })
  }
}

const getFilteredOptions = (userInput: string): SelectOption[] => {
  const query = userInput.toLowerCase()
  return getOptions().filter((option) => {
    const haystack = `${option.name} ${option.description}`.toLowerCase()
    return haystack.includes(query)
  })
}

const init = async () => {
  try {
    const rootPath = process.cwd()

    const packageJson: any = await Bun.file(`${rootPath}/package.json`).json()

    const packageJsonKeySchema = z.record(z.string(), z.string()).optional()

    const parsedJson = z
      .object({
        scripts: packageJsonKeySchema,
        devDependencies: packageJsonKeySchema,
        dependencies: packageJsonKeySchema,
        peerDependencies: packageJsonKeySchema
      })
      .parse(packageJson)

    let scripts: PackageScript[] = []
    if (parsedJson.scripts) {
      scripts = Object.entries(parsedJson.scripts).map(([name, content]) => {
        return {
          name,
          content
        }
      })
    }

    let devDeps: PackageDependency[] = []

    if (parsedJson.devDependencies) {
      devDeps = Object.entries(parsedJson.devDependencies).map(([name, version]) => {
        return {
          name,
          version,
          type: 'DEV'
        }
      })
    }

    let peerDeps: PackageDependency[] = []

    if (parsedJson.peerDependencies) {
      peerDeps = Object.entries(parsedJson.peerDependencies).map(([name, version]) => {
        return {
          name,
          version,
          type: 'PEER'
        }
      })
    }

    let hardDeps: PackageDependency[] = []

    if (parsedJson.dependencies) {
      hardDeps = Object.entries(parsedJson.dependencies).map(([name, version]) => {
        return {
          name,
          version,
          type: 'HARD'
        }
      })
    }

    const newState: AppState = {
      dependencies: [...devDeps, ...peerDeps, ...hardDeps],
      scripts,
      view: 'Main'
    }

    Store.setState(newState, true)
  } catch (e) {
    runCommandThenClose(['echo', 'Failed to process package.json'])
  }
}

export default {
  init,
  use: Store.use,
  update: Store.update,
  current: Store.current,
  getOptions,
  getFilteredOptions,
  setView
}
