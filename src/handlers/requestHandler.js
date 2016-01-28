import Joi from 'joi'
import request from '../request'
import appConfig from '../../config/config'
import {handleError, isNotHttpOk} from './errorHandler'

export const requestHandler = (method, handleSuccess) => (req, reply) => {
  const maxRedirects = req.query.maxRedirects || 3

  request({
    method: method,
    url: req.query.url,
    maxRedirects: maxRedirects,
    followRedirect: maxRedirects > 0,
    timeout: appConfig.timeout,
    gzip: true
  }, (err, res, body, httpRequest) => {
    reply(
      err || isNotHttpOk(res)
      ? handleError(err, res, httpRequest)
      : handleSuccess(res, body, httpRequest)
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
