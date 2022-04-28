const {_, truncateFileName} = require('../src/filesystem.js')

test ('normal file', () => {
  const filename = "test_export/Areas.csv"
  const expected = new RegExp(filename + "$")

  const result = truncateFileName(filename)
  expect(result).toMatch(expected)
})

test ('file with notion id', () => {
  const filename = "test_export/Project/Testing c5c7c49a7992411e795ca0a16ce45574.md"
  const expected = new RegExp("test_export/Project/Testing.md$")

  const result = truncateFileName(filename)
  expect(result).toMatch(expected)
})
