# Cell Class

The `Cell` class represents a single cell within a grid, managing its content, formatting, and reactive relationships.

## Overview

A cell maintains its state through reactive properties (using Vue.js reactivity system) and provides computed values based on formulas, references, and formatting rules.

## Reactive Architecture

```mermaid
flowchart TD
    subgraph Reactive_Sources[Reactive Sources]
        direction LR
        input["input (ref)"]
        isoDateInput["isoDateInput (ref)"]
        cellType["cellType (ref)"]
        numberFormatter["numberFormatter (ref)"]
        dateFormatter["dateFormatter (ref)"]
        style Reactive_Sources fill:none,stroke:#333,stroke-width:3px
    end

    %% First Level Computed
    computedInput["computedInput (computed)"]
    formula["formula (computed)"]
    
    %% Dependencies for computedInput
    input --> computedInput
    isoDateInput --> computedInput
    
    %% Dependencies for formula
    computedInput --> formula
    
    %% Next Level Computed
    directLitsDeps["directLitsDeps (computed)"]
    formula --> directLitsDeps
    
    references["references (computed)"]
    directLitsDeps --> references
    
    allLitsDeps["allLitsDeps (computed)"]
    references --> allLitsDeps
    directLitsDeps --> allLitsDeps
    
    numberInput["numberInput (computed)"]
    computedInput --> numberInput
    
    formulaResult["formulaResult (computed)"]
    formula --> formulaResult
    allLitsDeps --> formulaResult
    
    output["output (computed)"]
    computedInput --> output
    numberInput --> output
    formulaResult --> output
    
    isoDate["isoDate (computed)"]
    isoDateInput --> isoDate
    output --> isoDate
    
    derivedType["derivedType (computed)"]
    cellType --> derivedType
    numberInput --> derivedType
    isoDate --> derivedType
    output --> derivedType
    
    formattedNumber["formattedNumber (computed)"]
    derivedType --> formattedNumber
    output --> formattedNumber
    numberFormatter --> formattedNumber
    
    formattedDate["formattedDate (computed)"]
    isoDate --> formattedDate
    dateFormatter --> formattedDate
    derivedType --> formattedDate
    
    display["display (computed)"]
    output --> display
    error --> display
    formattedNumber --> display
    formattedDate --> display
    
    error["error (computed)"]
    output --> error
    formulaResult --> error
    formattedNumber --> error
    formattedDate --> error
    cellType --> error
    isoDate --> error

    %% Styling
    classDef refNode fill:#ff7676,stroke:#333,stroke-width:2px,color:#000
    classDef computedNode fill:#4a69bd,stroke:#333,stroke-width:2px,color:#fff
    
    class input,isoDateInput,cellType,numberFormatter,dateFormatter refNode
    class computedInput,formula,directLitsDeps,references,allLitsDeps,numberInput,formulaResult,output,isoDate,derivedType,formattedNumber,formattedDate,display,error computedNode
```


