const Router = require('koa-router')
const Moment = require('moment')
const Faker = require('faker')
const IdGenerator = require('uuid')

const router = new Router()

router
  .get('/v1/pms/reservations/:id', ctx => {
    const { body } = ctx.request
    var id = ctx.params.id
    body.id = IdGenerator()
    body.terms = { acceptedAt: Moment().format(), acceptedBy: Faker.internet.email(), signature: ':)' }
    body.mainCustomer = { address: Faker.address.streetAddress(), mail: Faker.internet.email() }
    body.mainGuestId = IdGenerator()
    body.hostelId = IdGenerator()
    body.createdAt = Moment().format()
    body.updatedAt = Moment().format()
    if (id.startsWith('guest:')) {
      id = id.replace('guest:', '')
      body.mainGuestId = id
    }
    if (id !== 'no-traveler') body.terms.acceptedBy = id
    if (id === 'no-terms') body.terms = null
    ctx.body = { data: body }
  })

module.exports = router
