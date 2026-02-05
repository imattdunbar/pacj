#!/usr/bin/env bun

if (typeof Bun === 'undefined') {
  console.error('[pacj] This CLI requires Bun. Install it: https://bun.sh')
  console.error('       Then run: bun install -g pacj')
  process.exit(1)
}

import { createCliRenderer, TextareaRenderable, type SelectOption } from '@opentui/core'
import { createRoot, useKeyboard } from '@opentui/react'
import AppState, { type AppView } from './AppState'
import { useRef } from 'react'
import z from 'zod'
import SelectList from './SelectList'
import RemovePackageSelect from './RemovePackageSelect'

export const DEV = z
  .preprocess((value) => value === 'true', z.boolean())
  .default(false)
  .parse(process.env.DEV)

export const AppRenderer = await createCliRenderer({ exitOnCtrlC: true })

export async function closeTUI() {
  await AppRenderer.destroy()
}

export async function runCommandThenClose(cmd: string[]) {
  await closeTUI()

  const proc = Bun.spawn({
    cmd,
    cwd: process.cwd(),
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit'
  })

  const exitCode = await proc.exited

  setTimeout(() => {
    process.exit(exitCode ?? 0)
  }, 500)
}

try {
  await AppState.init()
} catch (e) {
  console.error(e)
  runCommandThenClose(['echo', 'Failed to process package.json'])
}

function App() {
  const view = AppState.use((s) => s.view)
  const setView = AppState.setView

  const textAreaRef = useRef<TextareaRenderable | null>(null)

  const handleSelect = async (option: SelectOption) => {
    if (view === 'Main') {
      setView(option.name as AppView)
      return
    }

    if (view === 'List Packages') {
      await runCommandThenClose(['echo', option.name])
    }

    if (view === 'Run Script') {
      await runCommandThenClose(['bun', 'run', option.name])
    }
  }

  const handleAddPackages = async (packages: string[]) => {
    await runCommandThenClose(['bun', 'install', ...packages])
  }

  return (
    <box
      flexGrow={1}
      width="100%"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      backgroundColor="transparent"
    >
      <box flexDirection="column" gap={1} width={'100%'} padding={2}>
        {(view === 'Main' || view === 'List Packages' || view === 'Run Script') && (
          <SelectList
            showDescription={view !== 'Main'}
            onSelect={async (option) => {
              await handleSelect(option)
            }}
          />
        )}

        {view === 'Add Package' && (
          <box>
            <text>
              <strong>{view === 'Add Package' ? 'Packages to add' : 'Packages to remove'}</strong>
            </text>
            <box border borderStyle="rounded" backgroundColor="transparent" width="100%">
              <textarea
                ref={textAreaRef}
                focused={true}
                onKeyDown={async (e) => {
                  if (e.name === 'return') {
                    e.preventDefault()
                    const userText = textAreaRef.current?.editBuffer.getText().trim()
                    const packages = userText?.split(' ').filter((v) => Boolean(v))
                    await handleAddPackages(packages ?? [])
                  }
                }}
              />
            </box>
          </box>
        )}

        {view === 'Remove Package' && <RemovePackageSelect />}
      </box>
    </box>
  )
}

if (DEV) {
  AppRenderer.console.show()
  console.log(`Running in DEV mode | CWD: ${process.cwd()}`)
}

AppRenderer.keyInput.on('keypress', (key) => {
  if (key.name === 'escape') {
    AppRenderer.destroy()
    process.exit(0)
  }

  if (key.option && DEV) {
    if (key.name === 'd') {
      AppRenderer.console.toggle()
    }
    if (key.name === 'c') {
      AppRenderer.console.clear()
    }
  }
})

createRoot(AppRenderer).render(<App />)
