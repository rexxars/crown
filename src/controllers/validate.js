import Joi from 'joi'

const validateHandler = (request, reply) => {
  reply('bar')
}

export const config = {
  validate: {
    query: {
      url: Joi.string().required().uri({scheme: ['http', 'https']})
    }
  }
}

export default validateHandler
