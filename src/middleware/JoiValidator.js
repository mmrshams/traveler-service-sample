// This is a validation middleware which can be used to validate requests based on Joi schema.

import Joi from 'joi'
import _ from 'lodash'
import isStream from 'is-stream'
import { Oops } from '@gokiteam/oops'

const privates = {
  joiValidator (schema) {
    const validator = async (ctx, next) => {
      try {
        Joi.validate(ctx.query, schema.query || {}, (error, value) => {
          if (error) {
            throw error
          } else {
            privates.assignConvertedQueryToCtx(ctx.query, value)
          }
        })
        const paramsValidationResult = Joi.validate(ctx.params, schema.params || {})
        if (paramsValidationResult.error) {
          throw paramsValidationResult.error
        }
        Joi.validate(ctx.request.body, schema.body || {}, (error, value) => {
          if (error) {
            throw error
          } else {
            // Replacing streams values with the values converted by validator should be avoided.
            Object.keys(value).forEach(key => {
              if (!(_.isArray(value[key]) && isStream(value[key][0])) && !isStream(value[key])) {
                ctx.request.body[key] = value[key]
              }
            })
          }
        })
      } catch (error) {
        throw Oops.invalidArgument(error.message || 'Validation failed!')
      }
      await next()
    }
    validator.schema = schema
    return validator
  },
  isSchema (obj) {
    if (obj.query || obj.params || obj.body) return true
    return false
  },
  convertToMiddleware (schemas) {
    Object.keys(schemas).forEach((key) => {
      if (!privates.isSchema(schemas[key])) {
        privates.convertToMiddleware(schemas[key])
      } else {
        schemas[key] = privates.joiValidator(schemas[key])
      }
    })
  },
  assignConvertedQueryToCtx (originalQuery, queryParams) {
    Object.keys(queryParams).forEach(key => {
      if (privates.isNested(key)) {
        originalQuery[key] = {}
        privates.assignToCtx(originalQuery[key], key)
      } else {
        originalQuery[key] = queryParams[key]
      }
    })
  },
  isNested (key) {
    return _.isPlainObject(key)
  }
}

const JoiValidator = () => {
  return (schemas) => {
    privates.convertToMiddleware(schemas)
    return schemas
  }
}

export default JoiValidator
