# Row Height and Column Width
These should never be "auto-set" when they have been explicitly set.

# Add More PubSub events
* Diagram
* Add / remove grids

# Redesign Toolbar
## Group similar actions in drop down menus
## Add fonts
### Sans-serif Fonts
* Arial
* Helvetica
* Verdana
* Tahoma
* Trebuchet MS
* Geneva
* Calibri
* Candara
* Gill Sans
* Century Gothic
* Lucida Grande
* Segoe UI
### Serif Fonts
* Times New Roman
* Times
* Georgia
* Palatino
* Garamond
* Bookman
* Baskerville
* Cambria
* Didot
* Goudy Old Style
* Lucida Bright
### Monospaced Fonts
* Courier New
* Courier
* Lucida Console
* Monaco
* Consolas
* Andale Mono
* Menlo
* Source Code Pro
* Inconsolata
* Fira Mono
### Cursive Fonts
* Comic Sans MS
* Brush Script MT
* Lucida Handwriting
* Pacifico
### Fantasy Fonts
* Impact
* Luminari
* Chalkduster
* Jazz LET

# PegJS

# Spill Feature Implementation Plan

## Overview
Implement Excel-like "spill" functionality for formulas that return arrays, allowing a single formula to populate multiple cells.

## Cell Structure
- Add `spillValue` property to cells: `{ source: string, value: any } | null`
- Create `internalOutput` computed for raw formula result
- Modify `output` computed to prioritize `spillValue ?? internalOutput`

## Implementation Steps
1. When a formula evaluates to an array, detect this in a watcher on `internalOutput`
2. Call Grid's `handleSpill(sourceCell, arrayValues)` synchronously
3. Grid checks for collisions with existing values/formulas
4. If no collisions, set `spillValue` on all affected cells
5. If collisions exist, return spill error to source cell
6. When formula changes/no longer returns array, call `handleSpill(sourceCell, null)` to clean up

## Spill Behavior
- 1D arrays (vectors) spill downward vertically
- 2D arrays (tables/matrices) spill down and to the right
- Affected cells appear read-only in UI
- Collision detection prevents overlapping spill ranges

## Formula Syntax
- `=formula()` - Standard behavior, spills if result is array
- `:=formula()` - New syntax, keeps array result in single cell without spilling

## Visual Indicators
- Add visual indicators for cells that are part of a spill range
- Show spill error when collision occurs