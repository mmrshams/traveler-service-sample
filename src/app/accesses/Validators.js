import Joi from 'joi'

const Validators = ({
  JoiValidatorMiddleware,
  AccessTypeEnum,
  AccessStatusEnum
}) => (
  JoiValidatorMiddleware({
    createOrOverwrite: {
      body: {
        travelerId: Joi.string().required(),
        requesterId: Joi.string().required(),
        type: Joi.string().valid(Object.values(AccessTypeEnum)).required(),
        hostelId: Joi.when('type', {
          is: AccessTypeEnum.checkIn,
          then: Joi.string().required(),
          otherwise: Joi.any().forbidden()
        })
      },
      query: {}
    },
    list: {
      query: {
        filter: {
          travelerId: Joi.string(),
          status: Joi.string().valid(Object.values(AccessStatusEnum)),
          type: Joi.string().valid(Object.values(AccessTypeEnum)),
          requesterId: Joi.string()
        }
      }
    },
    accept: {
      params: {
        id: Joi.string().required()
      },
      body: {
        travelerId: Joi.string().required()
      },
      query: {}
    },
    deny: {
      params: {
        id: Joi.string().required()
      },
      body: {
        travelerId: Joi.string().required()
      },
      query: {}
    }
  })
)

export default Validators
