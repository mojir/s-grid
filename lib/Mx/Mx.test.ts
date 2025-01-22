import { describe, expect, it } from 'vitest'
import { Mx } from '.'

describe('Mx', () => {
  describe('from', () => {
    it('should create an Mx instance from a valid matrix', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      expect(mx).toBeInstanceOf(Mx)
    })

    it('should throw an error for an invalid matrix', () => {
      expect(() => Mx.from([[1, 2], [3]])).toThrow('Invalid matrix')
    })
  })

  describe('get', () => {
    it('should return the correct value', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      expect(mx.get(0, 1)).toBe(2)
    })

    it('should throw an error for out of bounds indices', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      expect(() => mx.get(2, 1)).toThrow('Index out of bounds')
    })
  })

  describe('set', () => {
    it('should set the correct value', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      mx.set(0, 1, 5)
      expect(mx.get(0, 1)).toBe(5)
    })

    it('should throw an error for out of bounds indices', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      expect(() => mx.set(2, 1, 5)).toThrow('Index out of bounds')
    })
  })

  describe('removeRows', () => {
    it('should remove one specified row', () => {
      const matrix = [[1, 2], [3, 4], [5, 6]]
      const mx = Mx.from(matrix)
      mx.removeRows(1)
      expect(mx.rows()).toEqual([[1, 2], [5, 6]])
    })

    it('should remove the specified rows', () => {
      const matrix = [[1, 2], [3, 4], [5, 6]]
      const mx = Mx.from(matrix)
      mx.removeRows(1, 2)
      expect(mx.rows()).toEqual([[1, 2]])
    })

    it('should throw an error for out of bounds indices', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      expect(() => mx.removeRows(2)).toThrow('Index out of bounds')
    })
  })

  describe('insertRows', () => {
    it('should insert one row', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      mx.insertRows(1, 1, () => 0)
      expect(mx.rows()).toEqual([[1, 2], [0, 0], [3, 4]])
    })

    it('should insert two rows', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      mx.insertRows(1, 2, () => 0)
      expect(mx.rows()).toEqual([[1, 2], [0, 0], [0, 0], [3, 4]])
    })

    it('should throw an error for out of bounds indices', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      expect(() => mx.insertRows(3, 1, () => 0)).toThrow('Index out of bounds')
    })
  })

  describe('insertCols', () => {
    it('should insert one column', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      mx.insertCols(1, 1, () => 0)
      expect(mx.rows()).toEqual([[1, 0, 2], [3, 0, 4]])
    })

    it('should insert two columns', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      mx.insertCols(1, 2, ({ rowIndex, colIndex }) => rowIndex + colIndex)
      expect(mx.rows()).toEqual([[1, 1, 2, 2], [3, 2, 3, 4]])
    })

    it('should throw an error for out of bounds indices', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      expect(() => mx.insertCols(3, 1, () => 0)).toThrow('Index out of bounds')
    })
  })

  describe('removeCols', () => {
    it('should remove one specified column', () => {
      const matrix = [[1, 2, 3], [4, 5, 6]]
      const mx = Mx.from(matrix)
      mx.removeCols(1)
      expect(mx.rows()).toEqual([[1, 3], [4, 6]])
    })

    it('should remove two columns', () => {
      const matrix = [[1, 2, 3], [4, 5, 6]]
      const mx = Mx.from(matrix)
      mx.removeCols(1, 2)
      expect(mx.rows()).toEqual([[1], [4]])
    })

    it('should throw an error for out of bounds indices', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      expect(() => mx.removeCols(2)).toThrow('Index out of bounds')
    })
  })

  describe('clone', () => {
    it('should create a deep copy of the matrix', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      const clone = mx.clone()
      expect(clone.rows()).toEqual(matrix)
      clone.set(0, 0, 5)
      expect(mx.get(0, 0)).toBe(1)
      expect(clone.get(0, 0)).toBe(5)
    })
  })

  describe('toTransposed', () => {
    it('should transpose the matrix', () => {
      const matrix = [[1, 2, 3], [4, 5, 6]]
      const mx = Mx.from(matrix)
      const transposed = mx.toTransposed()
      expect(transposed.rows()).toEqual([[1, 4], [2, 5], [3, 6]])
    })
  })

  describe('map', () => {
    it('should map the matrix values', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      const mapped = mx.map(value => value * 2)
      expect(mapped.rows()).toEqual([[2, 4], [6, 8]])
    })
  })

  describe('forEach', () => {
    it('should iterate over the matrix values', () => {
      const matrix = [[1, 2], [3, 4]]
      const mx = Mx.from(matrix)
      const result: number[] = []
      mx.forEach(value => result.push(value))
      expect(result).toEqual([1, 2, 3, 4])
    })
  })

  describe('keepNumbers', () => {
    it('should keep only numbers and replace others with null', () => {
      const matrix = Mx.from([
        [1, 'a', 3],
        [4, 5, 'b'],
        [7, 'c', 9],
      ])
      const result = matrix.keepNumbers().rows()
      expect(result).toEqual([
        [1, null, 3],
        [4, 5, null],
        [7, null, 9],
      ])
    })

    it('should handle matrix with all numbers', () => {
      const matrix = Mx.from([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ])
      const result = matrix.keepNumbers().rows()
      expect(result).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ])
    })

    it('should handle matrix with no numbers', () => {
      const matrix = Mx.from([
        ['a', 'b', 'c'],
        ['d', 'e', 'f'],
        ['g', 'h', 'i'],
      ])
      const result = matrix.keepNumbers().rows()
      expect(result).toEqual([
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ])
    })

    it('should handle matrix with NaN values', () => {
      const matrix = Mx.from([
        [1, NaN, 3],
        [NaN, 5, NaN],
        [7, NaN, 9],
      ])
      const result = matrix.keepNumbers().rows()
      expect(result).toEqual([
        [1, null, 3],
        [null, 5, null],
        [7, null, 9],
      ])
    })
  })

  describe('flat', () => {
    it('should flatten a 2x2 matrix', () => {
      const matrix = Mx.from([
        [1, 2],
        [3, 4],
      ])
      expect(matrix.flat()).toEqual([1, 2, 3, 4])
    })

    it('should flatten a 3x3 matrix', () => {
      const matrix = Mx.from([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ])
      expect(matrix.flat()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    })

    it('should flatten a matrix with different types', () => {
      const matrix = Mx.from<unknown>([
        [1, 'a'],
        [true, null],
      ])
      expect(matrix.flat()).toEqual([1, 'a', true, null])
    })

    it('should flatten a matrix with one row', () => {
      const matrix = Mx.from([
        [1, 2, 3],
      ])
      expect(matrix.flat()).toEqual([1, 2, 3])
    })

    it('should flatten a matrix with one column', () => {
      const matrix = Mx.from([
        [1],
        [2],
        [3],
      ])
      expect(matrix.flat()).toEqual([1, 2, 3])
    })
  })
})
