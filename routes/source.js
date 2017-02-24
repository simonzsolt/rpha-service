'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Source = require('../models/source');

const sourceItems = module.context.collection('source');
const keySchema = joi.string().required()
.description('The key of the source');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.get(function (req, res) {
  res.send(sourceItems.all());
}, 'list')
.response([Source], 'A list of sourceItems.')
.summary('List all sourceItems')
.description(dd`
  Retrieves a list of all sourceItems.
`);


router.post(function (req, res) {
  const source = req.body;
  let meta;
  try {
    meta = sourceItems.save(source);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(source, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: source._key})
  ));
  res.send(source);
}, 'create')
.body(Source, 'The source to create.')
.response(201, Source, 'The created source.')
.error(HTTP_CONFLICT, 'The source already exists.')
.summary('Create a new source')
.description(dd`
  Creates a new source from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let source
  try {
    source = sourceItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(source);
}, 'detail')
.pathParam('key', keySchema)
.response(Source, 'The source.')
.summary('Fetch a source')
.description(dd`
  Retrieves a source by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const source = req.body;
  let meta;
  try {
    meta = sourceItems.replace(key, source);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(source, meta);
  res.send(source);
}, 'replace')
.pathParam('key', keySchema)
.body(Source, 'The data to replace the source with.')
.response(Source, 'The new source.')
.summary('Replace a source')
.description(dd`
  Replaces an existing source with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let source;
  try {
    sourceItems.update(key, patchData);
    source = sourceItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(source);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the source with.'))
.response(Source, 'The updated source.')
.summary('Update a source')
.description(dd`
  Patches a source with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    sourceItems.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a source')
.description(dd`
  Deletes a source from the database.
`);
