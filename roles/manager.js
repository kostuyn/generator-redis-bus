'use strict';

function Manager(redisService) {
    this._redisService = redisService;
}

Manager.prototype.setGenerator = function (generator) {
    this.generator = generator;
};

Manager.prototype.setMessageHandler = function (messageHandler) {
    this.messageHandler = messageHandler;
};

Manager.prototype.setErrorHandler = function (errorHandler) {
    this.errorHandler = errorHandler;
};

Manager.prototype.start = function (getErrors, callback) {
    var self = this;
    if (getErrors) {
        return self.errorHandler.start(function (err) {
            callback(err);
        });
    }

    self._redisService.checkGenerator(function (err, result) {
        if (err) {
            return callback(err);
        }

        if (result) {
            return self.messageHandler.start(function (err) {
                callback(err);
            });

        }

        self.generator.start(function (err) {
            callback(err);
        });
    });
};

module.exports = Manager;