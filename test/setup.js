/* eslint-disable no-process-env, no-console */
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION', reason)
})
