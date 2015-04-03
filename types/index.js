'use strict'

module.exports = function (context) {
	require('./array')(context)
	require('./hash')(context)
	require('./numeric')(context)
	require('./other')(context)
	require('./string')(context)
}