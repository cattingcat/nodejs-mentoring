'use strict';

let winston = require('winston');

let logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            name: 'info-console',
            level: 'info'
        }),
        new (winston.transports.File)({
            name: 'error-file',
            filename: 'logs.log',
            leve: 'error'
         })
    ]
});

logger.info('logger instaled');

exports.logger = logger;
