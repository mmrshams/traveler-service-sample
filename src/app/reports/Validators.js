// This sample module includes all validation schemas related to travelers resource endpoints

import Joi from 'joi'

const Validators = ({
  JoiValidatorMiddleware,
  ReportsListingExtendEnum,
  TravelerReportsModel
}) => (
  JoiValidatorMiddleware({
    createOrUpdate: {
      body: {
        reporterId: Joi.string().required(),
        travelerId: Joi.string().required(),
        reason: Joi.string()
      }
    },
    list: {
      query: {
        filter: Joi.object().keys({
          needReview: Joi.boolean(),
          travelerId: Joi.string(),
          reporterId: Joi.string(),
          travelerIdOrReporterId: Joi.string()
        }),
        page: Joi.object().keys({
          limit: Joi.number().integer().min(1),
          offset: Joi.number().integer().min(0)
        }),
        sort: Joi.array().items(Joi.object().keys({
          field: Joi.string().valid(TravelerReportsModel.defaults.sortableFields),
          order: Joi.string()
        })).unique(),
        extend: Joi.array().items(Joi.string().valid(Object.values(ReportsListingExtendEnum))).unique()
      }
    }
  })
)

export default Validators
