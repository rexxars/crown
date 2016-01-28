import {requestHandler, config as requestConfig} from './requestHandler'

const handleSuccess = (res, body, req) => {
  return {
    statusCode: res.statusCode,
    resolvedUrl: req.uri.href
  }
}

const validationHandler = requestHandler('HEAD', handleSuccess)

export const config = requestConfig
export default validationHandler
