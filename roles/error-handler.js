'use strict';

var log=require('debug')('develop');

function ErrorHandler(redisService) {
    this._redisService = redisService;
}

ErrorHandler.prototype.start = function (callback) {
    log('ErrorHandler is started.');

    var self = this;
    self._redisService.getErrors(function (err, results) {
        if (err) {
            return callback(err);
        }

        results.forEach(function (error) {
            console.log(error);
        });

        callback(null);
    });
};

module.exports = ErrorHandler;