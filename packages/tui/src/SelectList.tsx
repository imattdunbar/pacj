import { useKeyboard } from '@opentui/react'
import AppState from './AppState'
import type { SelectOption } from '@opentui/core'

const SelectList = (props: { showDescription: boolean; onSelect: (option: SelectOption) => void }) => {
  const userInput = AppState.use((s) => s.userInput)
  const setUserInput = AppState.setUserInput

  useKeyboard((key) => {
    const hasModifier = key.ctrl || key.meta || key.option
    if (hasModifier) return

    if (key.name === 'space') {
      setUserInput(userInput + ' ')
      return
    }

    const invalidKeys = ['return', 'up', 'down', 'left', 'right']
    if (invalidKeys.includes(key.name)) return

    if (key.name === 'backspace') {
      setUserInput(userInput.slice(0, -1))
      return
    }

    setUserInput(userInput + key.name)
  })

  const filteredOptions = AppState.getFilteredOptions(userInput)

  const PANEL_BG = '#1f1f1f'

  return (
    <box paddingTop={1} backgroundColor={PANEL_BG}>
      <box width="100%" paddingLeft={1} backgroundColor={PANEL_BG}>
        <input
          value={userInput}
          onChange={setUserInput}
          placeholder="Type to filter"
          width="100%"
          backgroundColor="transparent"
          focusedBackgroundColor="transparent"
          textColor="#ffffff"
          placeholderColor="#8a8a8a"
        />
      </box>
      <select
        showDescription={props.showDescription}
        marginTop={1}
        paddingTop={0.5}
        paddingBottom={0.5}
        options={filteredOptions}
        focused
        height={16}
        width="100%"
        backgroundColor={PANEL_BG}
        selectedBackgroundColor="#2a2a2a"
        selectedTextColor="#ffffff"
        onSelect={(_index, option) => {
          if (!option) return
          props.onSelect(option)
          AppState.setUserInput('')
        }}
      />
    </box>
  )
}

export default SelectList
