import {requestHandler, config as requestConfig} from './requestHandler'

const handleSuccess = (req, res, body, resolvedUrl) => {
  return {
    statusCode: res.statusCode,
    resolvedUrl: resolvedUrl
  }
}

const validationHandler = requestHandler('HEAD', handleSuccess)

export const config = requestConfig
export default validationHandler
