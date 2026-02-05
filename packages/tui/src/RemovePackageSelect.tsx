import { useKeyboard, useTerminalDimensions } from '@opentui/react'
import { useState } from 'react'
import AppState from './AppState'
import { runCommandThenClose } from '.'

const RemovePackageSelect = () => {
  const hardOptions = AppState.current().dependencies.filter((d) => d.type === 'HARD')
  const devOptions = AppState.current().dependencies.filter((d) => d.type === 'DEV')
  const peerOptions = AppState.current().dependencies.filter((d) => d.type === 'PEER')

  const items = [...hardOptions, ...devOptions, ...peerOptions]

  const { height: terminalHeight } = useTerminalDimensions()

  const [activeIndex, setActiveIndex] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [focusTarget, setFocusTarget] = useState<'list' | 'done'>('list')

  const isListFocused = focusTarget === 'list'
  const isDoneFocused = focusTarget === 'done'

  useKeyboard(async (key) => {
    if (key.name === 'tab') setFocusTarget((t) => (t === 'list' ? 'done' : 'list'))

    if (key.name === 'up') setActiveIndex((i) => Math.max(0, i - 1))

    if (key.name === 'down') setActiveIndex((i) => Math.min(items.length - 1, i + 1))

    if (key.name === 'space' || key.name === 'enter' || key.name === 'return') {
      if (focusTarget === 'list') {
        handleSetSelected(activeIndex)
      }

      if (focusTarget === 'done') {
        await finishSelection()
      }
    }
  })

  const handleSetSelected = (index: number) => {
    const name = items[index]?.name
    if (!name) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
        return next
      }
      next.add(name)
      return next
    })
  }

  const finishSelection = async () => {
    console.log(Array.from(selected).join(','))
    await runCommandThenClose(['echo', Array.from(selected).join(',')])
  }

  //

  return (
    <box flexDirection="column" alignItems="center" justifyContent="center" width="100%">
      <scrollbox
        focused={false}
        height={Math.max(15, terminalHeight - 15)}
        width={'100%'}
        style={{
          rootOptions: { backgroundColor: '#1f1f1f' },
          wrapperOptions: { backgroundColor: '#1f1f1f' },
          viewportOptions: { backgroundColor: '#1f1f1f' },
          contentOptions: { backgroundColor: '#1f1f1f' },
          scrollbarOptions: {
            showArrows: true,
            trackOptions: {
              foregroundColor: '#f5d76e',
              backgroundColor: '#3a3a3a'
            }
          }
        }}
      >
        {hardOptions.length > 0 && (
          <box width="100%" padding={1}>
            <text>
              <strong>Hard Dependencies</strong>
            </text>
            {hardOptions.map((dep, i) => {
              const indexActive = i === activeIndex
              const isActive = indexActive && isListFocused

              return (
                <text
                  key={dep.name}
                  fg={isActive ? '#ffffff' : '#b0b0b0'}
                  onMouseDown={() => {
                    setActiveIndex(i)
                    handleSetSelected(i)
                  }}
                >
                  {selected.has(dep.name) ? '[x] ' : '[ ] '}
                  {dep.name}
                </text>
              )
            })}
          </box>
        )}

        {devOptions.length > 0 && (
          <box width="100%" padding={1}>
            <text>
              <strong>Dev Dependencies</strong>
            </text>
            {devOptions.map((dep, i) => {
              const indexActive = i + hardOptions.length === activeIndex
              const isActive = indexActive && isListFocused
              return (
                <text
                  key={dep.name}
                  fg={isActive ? '#ffffff' : '#b0b0b0'}
                  onMouseDown={() => {
                    setActiveIndex(i + hardOptions.length)
                    handleSetSelected(i + hardOptions.length)
                  }}
                >
                  {selected.has(dep.name) ? '[x] ' : '[ ] '}
                  {dep.name}
                </text>
              )
            })}
          </box>
        )}

        {peerOptions.length > 0 && (
          <box width="100%" padding={1}>
            <text>
              <strong>Peer Dependencies</strong>
            </text>
            {peerOptions.map((dep, i) => {
              const indexActive = i + hardOptions.length + devOptions.length === activeIndex
              const isActive = indexActive && isListFocused
              return (
                <text
                  key={dep.name}
                  fg={isActive ? '#ffffff' : '#b0b0b0'}
                  onMouseDown={() => {
                    setActiveIndex(i + hardOptions.length + devOptions.length)
                    handleSetSelected(i + hardOptions.length + devOptions.length)
                  }}
                >
                  {selected.has(dep.name) ? '[x] ' : '[ ] '}
                  {dep.name}
                </text>
              )
            })}
          </box>
        )}
      </scrollbox>

      <box width="100%" flexDirection="row" justifyContent="center" marginTop={1}>
        <box
          backgroundColor={isDoneFocused ? '#f5d76e' : '#242424'}
          justifyContent="center"
          alignItems="center"
          titleAlignment="center"
          paddingTop={1}
          paddingBottom={1}
          paddingLeft={2}
          paddingRight={2}
          onMouseDown={async () => {
            await finishSelection()
          }}
        >
          <text fg={isDoneFocused ? '#1b1b1b' : '#e6e6e6'}>
            <strong>Done</strong>
          </text>
        </box>
      </box>
    </box>
  )
}

export default RemovePackageSelect
