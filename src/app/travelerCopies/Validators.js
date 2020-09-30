
import Joi from 'joi'

const Validators = ({ JoiValidatorMiddleware }) => (
  JoiValidatorMiddleware({
    list: {
      query: {
        q: Joi.string(),
        filter: Joi.object().keys({
          ownerId: Joi.string()
        }),
        page: Joi.object().keys({
          limit: Joi.number().integer().min(1),
          offset: Joi.number().integer().min(0)
        })
      }
    }
  })
)

export default Validators
