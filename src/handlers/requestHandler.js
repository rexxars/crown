import Joi from 'joi'
import request from '../request'
import appConfig from '../../config/config'
import {handleError, isNotHttpOk} from './errorHandler'

export const requestHandler = (method, handleSuccess) => (req, reply) => {
  let resolvedUrl = req.query.url
  request({
    method: method,
    url: req.query.url,
    redirects: req.query.maxRedirects || 3,
    timeout: appConfig.timeout,
    redirected: (status, location) => resolvedUrl = location
  }, (err, res, body) => {
    reply(
      err || isNotHttpOk(res)
      ? handleError(err, res, resolvedUrl)
      : handleSuccess(req, res, body, resolvedUrl)
    )
  })
}

export const config = {
  validate: {
    query: {
      url: Joi.string().required().uri({scheme: ['http', 'https']}),
      maxRedirects: Joi.number().integer().min(0).max(10)
    }
  }
}
