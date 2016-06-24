'use strict';

function Manager(redisService, msgTimeout, expireTimeout) {
    this._redisService = redisService;
    this.msgTimeout = msgTimeout;
    this.touchTimeout = expireTimeout / 2 || 250;
    this.checkTimeout = expireTimeout || 500;
}

Manager.prototype.setGenerator = function (generator) {
    this._generator = generator;
};

Manager.prototype.setMessageHandler = function (messageHandler) {
    this._messageHandler = messageHandler;
};

Manager.prototype.setErrorHandler = function (errorHandler) {
    this._errorHandler = errorHandler;
};

Manager.prototype.switchToMessageHandler = function (callback) {
    this._messageHandler.start(callback);
};

Manager.prototype.switchToGenerator = function (callback) {
    this._generator.start(callback);
};

Manager.prototype.start = function (getErrors, callback) {
    var self = this;
    if (getErrors) {
        return self._errorHandler.start(function (err) {
            callback(err);
        });
    }

    self._redisService.checkGenerator(function (err, result) {
        if (err) {
            return callback(err);
        }

        if (result) {
            return self._messageHandler.start(function (err) {
                callback(err);
            });

        }

        self._generator.start(function (err) {
            callback(err);
        });
    });
};

Manager.prototype.stop = function () {
    this._generator.stop();
    this._messageHandler.stop();
};

module.exports = Manager;