# Koa microservice boilerplate
This boilerplate is designed to accelerate creating REST micro-services
using [Koa](https://koajs.com/) as underlying http server framework.

## Requirements
1. Make sure you have git, nvm, node, docker and docker-compose installed (node 10.16.0+, docker 18.03.0-ce+, docker-compose 1.21.2+).

## How to use
Start your development in 2 very easy steps:

1. Clone the project

`git clone  https://github.com/pixelsandcode/koa-microservice-boilerplate.git`

2. Start server

`npm start`

To start with **Docker Compose**, in project root run:

`docker-compose up`

If you encountered the following error: `Network tipi declared as external, but could not be found`
Run following command:

`docker network create tipi`

3. Start server for test purposes

`npm run start:test`

To start with **Docker Compose**, in project root run:

`docker-compose -f docker-compose.test.yaml up`


## Build & run in production
For production deployments, run following command to build the project:

`npm run build`

To run project in production, run

`npm run start:prd`

or, if you want use libraries like **PM2** or **Forever**, pass `build/Server.js`
to them.

## Build docker image
To build docker image for production run:

`docker build -t <your-image-tag> .`

## Special Source Directories

### app
Logical layer of your application is sitting here. This directory
includes multiple sub-directories that each of them is created for
a specific resource. For example if there is an endpoint `GET /users`,
it means there is a resource named `users` which has directory named
`users` in `app` directory. There are four `js` files for each resource:

- `Controllers.js`: includes all controller middlewares related to the endpoints.
- `Validators.js`: includes all validation rules related to the endpoints.
- `Routes.js`: includes definition of endpoints to link controllers and validators.
- `Logic.js`: includes all complicated logic related to the resource.

### middleware
The middleware which are commonly used by resources or project
bootstraper are sitting in this directory. There are few pre-defined
middleware. Feel free to add more of them. All middleware are named like
`<MiddlewareName>.js`.

### models
Data layer of your application is sitting here. There isn't any constraint
on how to define your models or how to connect them to a database. Put
your own implementation as classes, each of them for an entity in your
application. Controllers and Logic are using these models to manipulate data. All
models are named like `<ModelName>.js`

### enums
The directory includes enumerations which will be used across all layers.
All enums are named like `<EnumName>.js`

## Special Files

### Server.js
This module bootstraps the application. It creates dependency container,
registers middleware and starts http server. You can start reading the project from [Server.js](src/Server.html)

### DependencyInjector.js
An [awilix](https://github.com/jeffijoe/awilix) dependency container is
defined and configured to enable dependency injection pattern. All of the
controllers, routes, validators, logic, models, middleware, helpers, and configs
of the project will be added automatically to the container. You can use any
other DI tool instead of awilix but you need to implement this file
properly (you maybe need to fix way of injection of dependencies to modules).

### helpers/Logger.js
A [winston](https://github.com/winstonjs/winston) logger defined and used
in this boilerplate. Feel free to change its configuration to meet your
needs. You also can use any other logging tool instead of winston (you maybe
need to fix its usages in boilerplate files).

### configs/Application.js
Application configuration is defined in this file. It's assumed that configurations
are set in environment variables.

### configs/Default.js
Default constant values which can be used application wide. It's assumed that
the values are set in environment variables

### Routes.js
This module combines all resources to a single instance of koa-router
middleware and is used by `Server.js` to register the middleware in koa
app.


## Development

### Add new endpoint
REST endpoints are categorized by resources in app layer. For example
`GET /pets` is intended as new endpoint. The endpoint should be added to
`app/pets` directory. If the directory doesn't exist, it should be created
and four files (`Routes.js`, `Controllers.js`, `Validators.js`, `Logic.js`)
should be added in it.

#### Routes.js
This file should export a factory function which will be used by DI container
to register the module and inject dependencies through it. Also the function
should return an instance of `koa-router`. As an example for the new endpoint
`GET /pets`, the `app/pets/Routes.js` file should be defined like this:

```javascript
import Router from 'koa-router';

module.exports = ({ JoiValidatorMiddleware, PetsValidators, PetsControllers }) => {
  const router = new Router();

  router.get('/pets', JoiValidatorMiddleware(PetsValidators.list), PetsControllers.list);

  return router;
};
```

In above snippet we assumed that `app/pets/Validators.js` and `app/pets/Controllers.js`
are created properly (as we will show in next sections), so we can invoke
them from DI container.

To add more endpoints to `pets` resource, just register them on the `koa-router` instance
declared above. Read more about `koa-router` [here](https://github.com/ZijianHe/koa-router).

#### Controllers.js
This file (like any other module in this project), should export a factory
function which returns an object, packaging all controllers as middleware functions.
As an example for the `GET /pets` endpoint, `app/pets/Controllers.js` should be
defined like this:

```javascript
module.exports = ({ PetModel }) => ({

  async list(ctx) {
    const pets = await PetModel.getAllPets();
    ctx.body = pets;
  },
});
```

In above snippet we assumed that `models/Pet.js` is created properly,
so we can invoke it from DI container.

To add more controllers just add it as new member of the returning object.
As an example we want to add new controller named `create`:

```javascript
module.exports = ({ PetModel }) => ({

  async list(ctx) {
    const pets = await PetModel.getAllPets();
    ctx.body = pets;
  },
  async create(ctx) {
    // controller implementation goes here
  },
});
```

#### Validators.js
This file exports a factory function which returns an object of joi schema
objects. As an example, assume the `GET /pets` endpoint accepts a query parameter
to search pets by their names. The `app/pets/Validators.js` should be defined
like this:

```javascript
const Joi = require('joi');

module.exports = ({ JoiValidatorMiddleware }) => (
  JoiValidatorMiddleware({
    list: {
      query: {
        name: Joi.string(),
      },
    },
  })
);
```

Like controller functions, new validator schemas can be added to the returning
object from the factory function. For example we define new `create` schema
like this:

```javascript
const Joi = require('joi');

module.exports = ({ JoiValidatorMiddleware }) => (
  JoiValidatorMiddleware({
    list: {
      query: {
        name: Joi.string(),
      },
    },
    create: {
      body: {
        name: Joi.string().required(),
        age: Joi.number().required()
      }
    },
  })
);
```

The schemas will be validated by `JoiValidatorMiddleware`. The middleware
is checking 3 parts of the schema: `body`, `params`, `query`. Each schema is
composition of one, two, or all of these parts.

Read more about `Joi` library [here](https://github.com/hapijs/joi).

#### Logic.js
This file also, exports a factory function which returns an object which contains multiple methods.
The logic layer is intended to be used when a controller needs to implement complicated
application logic which includes multiple models:

```javascript
const Logic = ({ PetModel, OwnerModel }) => {
  const publicMethods = {
    async list ({ id, query: { extend = [] } } = {}) {
      const pet = await PetModel.find(id)
      if (extend.length > 0 && extend.indexOf('owner') >= 0)
        pet.owner = await OwnerModel.find(pet.ownerId)
      return pet
    }
  }
  return publicMethods
}

export default Logic
```

Now the logic can be used in `Controllers.js` file like this:

```javascript
module.exports = ({ PetModel, PetsLogic }) => ({

  async listPets (ctx) {
    const { id } = ctx.params
    const { query } = ctx
    ctx.body = await PetsLogic.list({id, query});
  },
});
```

### Add new model
Each model file exports a factory function that returns a class which
is managing data of an entity in system. Model classes are encapsulating
all data layer logic and are providing methods to app layer. As an example
`models/Pet.js` file should be defined like this:

```javascript
module.exports = () => (
  class Pet {
    //methods should be implemented here
  }
);
```

### Add new middleware
To define new middleware, a middleware file should be added to `middleware`
directory. This file (like other modules) should export a factory function
that returns a koa middleware function. For example we need a new `SayHi`
middleware which adds `greeting` to response. We define `middleware/SayHi.js`
like this:

```javascript
module.exports = () => async (ctx, next) => {
  await next();
  ctx.body.greeting = "hi"
};
```

You can register this module in `Server.js` file to koa app instance or in
any `Routes.js` file in app layer.

## Configuration
There are 2 envconf files named `config.development` and `config.test` which
are used to set application's needed configuration as environment variables.

## Documentation
To create documents from your comments and deploy them to github pages,
run:
```
npm run github-pages
```

To generate documents locally run:
```
npm run docs
```

## Linting & Type check
The project is using [JavaScript Standard Style](https://standardjs.com/index.html)
for linting.

For type checking [flow](https://flow.org) is used. Use
[flow-typed](https://github.com/flow-typed/flow-typed) to install library
interface definitions if needed.

## Test

To run tests locally and generate json, html coverage report, run:
```
npm run test
```

To run tests in travis.ci and update coverall.io
```
npm run travis
```

To run test automatically with a watch
```
npm run tdd
// or specific files to watch
FILES='tests/a.spec.js tests/b.spec.js' npm run tdd
```