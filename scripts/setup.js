'use strict';
const db = require('@arangodb').db;
const documentCollections = [
	"verse",
	"source"
];
const edgeCollections = [
	"hasSource"
];

for (const localName of documentCollections) {
	// const qualifiedName = module.context.collectionName(localName);
	const qualifiedName = localName;;
	if (!db._collection(qualifiedName)) {
		db._createDocumentCollection(qualifiedName);
	} else if (module.context.isProduction) {
		console.warn(`collection ${qualifiedName} already exists. Leaving it untouched.`)
	}
}

for (const localName of edgeCollections) {
	// const qualifiedName = module.context.collectionName(localName);
	const qualifiedName = localName;
	if (!db._collection(qualifiedName)) {
		db._createEdgeCollection(qualifiedName);
	} else if (module.context.isProduction) {
		console.warn(`collection ${qualifiedName} already exists. Leaving it untouched.`)
	}
}