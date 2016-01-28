import {requestHandler, config as requestConfig} from './requestHandler'

const handleSuccess = (res, body, req) => {
  return {
    statusCode: res.statusCode,
    resolvedUrl: req.uri.href
  }
}

const resolveHandler = requestHandler('GET', handleSuccess)

export const config = requestConfig
export default resolveHandler
