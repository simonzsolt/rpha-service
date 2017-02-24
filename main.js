'use strict';

module.context.use('/verse', require('./routes/verse'), 'verse');
module.context.use('/source', require('./routes/source'), 'source');
module.context.use('/hassource', require('./routes/hassource'), 'hassource');
