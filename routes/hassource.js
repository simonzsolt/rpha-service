'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const HasSource = require('../models/hassource');

const hasSourceItems = module.context.collection('hasSource');
const keySchema = joi.string().required()
.description('The key of the hasSource');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;

const NewHasSource = Object.assign({}, HasSource, {
  schema: Object.assign({}, HasSource.schema, {
    _from: joi.string(),
    _to: joi.string()
  })
});


router.get(function (req, res) {
  res.send(hasSourceItems.all());
}, 'list')
.response([HasSource], 'A list of hasSourceItems.')
.summary('List all hasSourceItems')
.description(dd`
  Retrieves a list of all hasSourceItems.
`);


router.post(function (req, res) {
  const hasSource = req.body;
  let meta;
  try {
    meta = hasSourceItems.save(hasSource._from, hasSource._to, hasSource);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(hasSource, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: hasSource._key})
  ));
  res.send(hasSource);
}, 'create')
.body(NewHasSource, 'The hasSource to create.')
.response(201, HasSource, 'The created hasSource.')
.error(HTTP_CONFLICT, 'The hasSource already exists.')
.summary('Create a new hasSource')
.description(dd`
  Creates a new hasSource from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let hasSource
  try {
    hasSource = hasSourceItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(hasSource);
}, 'detail')
.pathParam('key', keySchema)
.response(HasSource, 'The hasSource.')
.summary('Fetch a hasSource')
.description(dd`
  Retrieves a hasSource by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const hasSource = req.body;
  let meta;
  try {
    meta = hasSourceItems.replace(key, hasSource);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(hasSource, meta);
  res.send(hasSource);
}, 'replace')
.pathParam('key', keySchema)
.body(HasSource, 'The data to replace the hasSource with.')
.response(HasSource, 'The new hasSource.')
.summary('Replace a hasSource')
.description(dd`
  Replaces an existing hasSource with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let hasSource;
  try {
    hasSourceItems.update(key, patchData);
    hasSource = hasSourceItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(hasSource);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the hasSource with.'))
.response(HasSource, 'The updated hasSource.')
.summary('Update a hasSource')
.description(dd`
  Patches a hasSource with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    hasSourceItems.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a hasSource')
.description(dd`
  Deletes a hasSource from the database.
`);
