import Joi from 'joi'

const resolveHandler = (request, reply) => {
  reply('foo')
}

export const config = {
  validate: {
    query: {
      url: Joi.string().required().uri({scheme: ['http', 'https']})
    }
  }
}

export default resolveHandler
