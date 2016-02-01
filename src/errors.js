import ExtendableError from 'es6-error'

export class DisallowedHostError extends ExtendableError {}
export class RequestTimeoutError extends ExtendableError {}
export class MaxAllowedBytesExceededError extends ExtendableError {}
