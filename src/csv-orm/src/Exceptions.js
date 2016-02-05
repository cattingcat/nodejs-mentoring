'use strict';

function MapperError(msg) {
    this.message = msg;
    this.name = 'MapperError';
    Error.captureStackTrace(this, MapperError)
}

MapperError.prototype = Object.create(Error.prototype);

exports.MapperError = MapperError;
