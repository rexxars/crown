const ExtendableError = require('es6-error')

class DisallowedHostError extends ExtendableError {}
class RequestTimeoutError extends ExtendableError {}
class MaxAllowedBytesExceededError extends ExtendableError {}

exports.DisallowedHostError = DisallowedHostError
exports.RequestTimeoutError = RequestTimeoutError
exports.MaxAllowedBytesExceededError = MaxAllowedBytesExceededError
