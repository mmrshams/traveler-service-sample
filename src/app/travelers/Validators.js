// This sample module includes all validation schemas related to travelers resource endpoints

import Joi from 'joi'

const Validators = ({
  JoiValidatorMiddleware,
  StateEnum,
  ChannelEnum,
  DeviceEnum,
  GenderEnum,
  HealthEnum,
  ExtendEnum,
  TravelerCustomFilterEnum,
  DefaultConfig: Default
}) => (
  JoiValidatorMiddleware({
    signup: {
      body: {
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().lowercase().trim().required(),
        hometown: Joi.object().keys({
          city: Joi.string(),
          country: Joi.string()
        }).required(),
        address: Joi.object().keys({
          address: Joi.string(),
          postCode: Joi.string(),
          city: Joi.string(),
          country: Joi.string()
        }),
        gender: Joi.string().valid(Object.values(GenderEnum)),
        middleName: Joi.string(),
        bio: Joi.string().max(400),
        dob: Joi.date(),
        mobile: Joi.string(),
        nationality: Joi.string(),
        birthPlace: Joi.string(),
        channel: Joi.string().valid(Object.values(ChannelEnum)).required(),
        interests: Joi.array().items(Joi.string().valid(Default.tagList)).unique()
      }
    },
    login: {
      body: {
        email: Joi.string().email().lowercase().trim().required(),
        auth: Joi.string().required(),
        device: Joi.string().valid(Object.values(DeviceEnum)).required(),
        version: Joi.string() // TODO: this will be used to notify if app update is required
      }
    },
    idValidator: {
      params: {
        id: Joi.string().required()
      }
    },
    verify: {
      body: {
        email: Joi.string().email().lowercase().trim().required(),
        verificationCode: Joi.string().required()
      }
    },
    resendVerification: {
      body: {
        email: Joi.string().email().lowercase().trim().required()
      }
    },
    generatePin: {
      body: {
        email: Joi.string().email().lowercase().trim().required()
      }
    },
    verifyPin: {
      body: {
        email: Joi.string().email().lowercase().trim().required(),
        pin: Joi.string().length(4).required()
      }
    },
    update: {
      params: {
        id: Joi.string().required()
      },
      body: {
        firstName: Joi.string(),
        lastName: Joi.string(),
        hometown: Joi.object().keys({
          city: Joi.string(),
          country: Joi.string()
        }),
        lastLocation: Joi.object().keys({
          lat: Joi.number().required(),
          lon: Joi.number().required()
        }),
        address: Joi.object().keys({
          address: Joi.string(),
          postCode: Joi.string(),
          city: Joi.string(),
          country: Joi.string()
        }),
        gender: Joi.string().valid(Object.values(GenderEnum)),
        middleName: Joi.string(),
        bio: Joi.string().max(400),
        dob: Joi.date(),
        mobile: Joi.string(),
        nationality: Joi.string(),
        birthPlace: Joi.string(),
        passport: Joi.object().keys({
          number: Joi.string(),
          expiry: Joi.date(),
          publicId: Joi.string() // Gateway should upload the image privately and send the publicId
        }),
        idCard: Joi.object().keys({
          number: Joi.string(),
          expiry: Joi.date(),
          publicId: Joi.string() // Gateway should upload the image privately and send the publicId
        }),
        driversLicense: Joi.object().keys({
          number: Joi.string(),
          expiry: Joi.date(),
          publicId: Joi.string() // Gateway should upload the image privately and send the publicId
        }),
        interests: Joi.array().items(Joi.string().valid(Default.tagList)).unique(),
        invisible: Joi.boolean()
      }
    },
    setAvatar: {
      body: {
        avatar: Joi.object().required()
      },
      params: {
        id: Joi.string().required()
      }
    },
    list: {
      query: {
        q: Joi.string(),
        filter: Joi.object().keys({
          state: Joi.string().valid(Object.values(StateEnum)),
          gender: Joi.string().valid(Object.values(GenderEnum)),
          health: Joi.string().valid(Object.values(HealthEnum)),
          custom: Joi.string().valid(Object.values(TravelerCustomFilterEnum)),
          country: Joi.string(),
          location: Joi.object().keys({
            lat: Joi.number().required(),
            lon: Joi.number().required()
          }),
          channel: Joi.string().valid(Object.values(ChannelEnum)),
          device: Joi.string().valid(Object.values(DeviceEnum)),
          travelerId: Joi.string(),
          travelerIds: Joi.array().items(Joi.string()).single(),
          hostelId: Joi.string(),
          viewerId: Joi.string(),
          interests: Joi.array().items(Joi.string().valid(Default.tagList)).unique(),
          invisible: Joi.boolean()
        }),
        page: Joi.object().keys({
          limit: Joi.number().integer().min(1),
          offset: Joi.number().integer().min(0)
        })
      }
    },
    batchDetails: {
      body: Joi.object().keys({
        ids: Joi.array().items(Joi.string()).max(Default.maxIdsSize).unique().single().required(),
        asObject: Joi.boolean(),
        activeTravelers: Joi.boolean(),
        withMissedItems: Joi.boolean(),
        viewerId: Joi.string(),
        hostelId: Joi.string()
      }).oxor('activeTravelers', 'viewerId')
        .oxor('hostelId', 'viewerId')
    },
    batchFind: {
      body: {
        emails: Joi.array().items(Joi.string()).max(Default.maxIdsSize).unique().single().required(),
        asObject: Joi.boolean(),
        withMissedItems: Joi.boolean(),
        activeTravelers: Joi.boolean()
      }
    },
    emailValidator: {
      query: {
        email: Joi.string().email().lowercase().trim().required()
      }
    },
    updateHealth: {
      params: {
        id: Joi.string().required()
      },
      body: {
        health: Joi.string().valid([HealthEnum.clean, HealthEnum.blocked]).required()
      }
    },
    details: {
      params: {
        id: Joi.string().required()
      },
      body: {},
      query: {
        viewerId: Joi.string(),
        filter: Joi.object().keys({
          hostelId: Joi.string()
        }),
        extend: Joi.array().items(Joi.string().valid(Object.values(ExtendEnum))).unique()
      }
    },
    acceptTerms: {
      params: {
        id: Joi.string().required()
      },
      body: {
        hostelId: Joi.string(),
        signature: Joi.string()
      },
      query: {}
    }
  })
)

export default Validators
