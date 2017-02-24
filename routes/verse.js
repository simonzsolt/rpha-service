'use strict';
const dd = require('dedent');
const db = require('@arangodb').db;
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Verse = require('../models/verse');

// const verseItems = module.context.collection('verse');
const verseItems = db._collection('verse');
const keySchema = joi.string().required()
	.description('The key of the verse');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.get(function(req, res) {
		res.send(verseItems.all());
	}, 'list')
	.response([Verse], 'A list of verseItems.')
	.summary('List all verseItems')
	.description(dd `
  Retrieves a list of all verseItems.
`);


router.post(function(req, res) {
		const verse = req.body;
		let meta;
		try {
			meta = verseItems.save(verse);
		} catch (e) {
			if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
				throw httpError(HTTP_CONFLICT, e.message);
			}
			throw e;
		}
		Object.assign(verse, meta);
		res.status(201);
		res.set('location', req.makeAbsolute(
			req.reverse('detail', {
				key: verse._key
			})
		));
		res.send(verse);
	}, 'create')
	.body(Verse, 'The verse to create.')
	.response(201, Verse, 'The created verse.')
	.error(HTTP_CONFLICT, 'The verse already exists.')
	.summary('Create a new verse')
	.description(dd `
  Creates a new verse from the request body and
  returns the saved document.
`);


router.get(':key', function(req, res) {
		const key = req.pathParams.key;
		let verse
		try {
			verse = verseItems.document(key);
		} catch (e) {
			if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
				throw httpError(HTTP_NOT_FOUND, e.message);
			}
			throw e;
		}
		res.send(verse);
	}, 'detail')
	.pathParam('key', keySchema)
	.response(Verse, 'The verse.')
	.summary('Fetch a verse')
	.description(dd `
  Retrieves a verse by its key.
`);


router.put(':key', function(req, res) {
		const key = req.pathParams.key;
		const verse = req.body;
		let meta;
		try {
			meta = verseItems.replace(key, verse);
		} catch (e) {
			if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
				throw httpError(HTTP_NOT_FOUND, e.message);
			}
			if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
				throw httpError(HTTP_CONFLICT, e.message);
			}
			throw e;
		}
		Object.assign(verse, meta);
		res.send(verse);
	}, 'replace')
	.pathParam('key', keySchema)
	.body(Verse, 'The data to replace the verse with.')
	.response(Verse, 'The new verse.')
	.summary('Replace a verse')
	.description(dd `
  Replaces an existing verse with the request body and
  returns the new document.
`);


router.patch(':key', function(req, res) {
		const key = req.pathParams.key;
		const patchData = req.body;
		let verse;
		try {
			verseItems.update(key, patchData);
			verse = verseItems.document(key);
		} catch (e) {
			if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
				throw httpError(HTTP_NOT_FOUND, e.message);
			}
			if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
				throw httpError(HTTP_CONFLICT, e.message);
			}
			throw e;
		}
		res.send(verse);
	}, 'update')
	.pathParam('key', keySchema)
	.body(joi.object().description('The data to update the verse with.'))
	.response(Verse, 'The updated verse.')
	.summary('Update a verse')
	.description(dd `
  Patches a verse with the request body and
  returns the updated document.
`);


router.delete(':key', function(req, res) {
		const key = req.pathParams.key;
		try {
			verseItems.remove(key);
		} catch (e) {
			if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
				throw httpError(HTTP_NOT_FOUND, e.message);
			}
			throw e;
		}
	}, 'delete')
	.pathParam('key', keySchema)
	.response(null)
	.summary('Remove a verse')
	.description(dd `
  Deletes a verse from the database.
`);
