module.exports = (config) => {
  config.set({
    mutator: 'javascript',
    packageManager: 'npm',
    reporters: ['html', 'clear-text', 'progress', 'dashboard'],
    testRunner: 'command',
    transpilers: ['babel'],
    coverageAnalysis: 'off',
    babel: {
      optionsFile: '.babelrc'
    }
  })
}
