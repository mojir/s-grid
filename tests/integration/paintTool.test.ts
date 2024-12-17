import { describe, expect, it } from 'vitest'
import { Color } from '~/lib/color'
import { CellLocator } from '~/lib/locators/CellLocator'
import { RangeLocator } from '~/lib/locators/RangeLocator'
import { Project } from '~/lib/project/Project'

const project = new Project()

describe('paint tool', () => {
  it('copies styles from one cell to another', async () => {
    const grid = project.currentGrid.value
    const a1 = CellLocator.fromString(grid, 'A1')
    const a2 = CellLocator.fromString(grid, 'A2')
    const bgColor = Color.fromHex('#ff0000')
    const color = Color.fromHex('#00ff00')

    grid.setInput('Hello', a1)
    grid.setAlign('middle', a1)
    grid.setJustify('center', a1)
    grid.setFontSize(24, a1)
    grid.setItalic(true, a1)
    grid.setBold(true, a1)
    grid.setTextDecoration('line-through', a1)
    grid.setBackgroundColor(bgColor, a1)
    grid.setTextColor(color, a1)

    grid.position.value = a1
    project.clipboard.copyStyleSelection(RangeLocator.fromCellLocator(a1))
    project.clipboard.pasteStyleSelection(RangeLocator.fromCellLocator(a2))

    expect(grid.getAlign(a2)).toBe('middle')
    expect(grid.getJustify(a2)).toBe('center')
    expect(grid.getFontSize(a2)).toBe(24)
    expect(grid.getItalic(a2)).toBe(true)
    expect(grid.getBold(a2)).toBe(true)
    expect(grid.getTextDecoration(a2)).toBe('line-through')
    expect(grid.getBackgroundColor(a2)).toEqual(bgColor)
    expect(grid.getTextColor(a2)).toEqual(color)

    // Input should not be copied
    expect(project.locator.getCellFromLocator(a2).input.value).toBe('')
  })
})
