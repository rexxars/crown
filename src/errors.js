exports.DisallowedHostError = class DisallowedHostError extends Error {
  constructor(...args) {
    super(...args)
    this.type = 'DisallowedHostError'
  }
}
exports.RequestTimeoutError = class RequestTimeoutError extends Error {
  constructor(...args) {
    super(...args)
    this.type = 'RequestTimeoutError'
  }
}
exports.MaxAllowedBytesExceededError = class MaxAllowedBytesExceededError extends (
  Error
) {
  constructor(...args) {
    super(...args)
    this.type = 'MaxAllowedBytesExceededError'
  }
}
