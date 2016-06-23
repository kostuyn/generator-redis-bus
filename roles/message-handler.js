'use strict';

var log = require('debug')('develop');

function MessageHandler(redisService, manager, eventHandler) {
    this._redisService = redisService;
    this._manager = manager;
    this._eventHandler = eventHandler;
}

MessageHandler.prototype.start = function (callback) {
    log('MessageHandler is started.');

    this._isStop = false;
    check.call(this, callback);
    getMsg.call(this, 0, callback);
};

function check(callback) {
    var self = this;
    setTimeout(function () {
        self._redisService.checkGenerator(function (err, result) {
            if (err) {
                return callback(err);
            }

            if (!result) {
                log('Switch to Generator.');
                self._isStop = true;
                self._manager.switchToGenerator(callback);
                return;
            }

            check.call(self, callback);
        });
    }, 500);
}

function getMsg(timeout, callback) {
    var self = this;
    setTimeout(function () {
        if (self._isStop) {
            return;
        }

        self._redisService.getMessage(function (err, msg) {
            if (err) {
                return callback(err);
            }

            if (!msg) {
                return getMsg.call(self, 500, callback);
            }

            // Processing message
            self._eventHandler(msg, function (err, msg) {
                if (err) {
                    self._redisService.logError(msg, function (err) {
                        if (err) {
                            return callback(err);
                        }
                    });
                }

                // Immediately receive next message
                getMsg.call(self, 0, callback);
            });
        });
    }, timeout);
}

function eventHandler(msg, callback) {
    function onComplete() {
        var error = Math.random() > 0.85;
        callback(error, msg);
    }

    setTimeout(onComplete, Math.floor(Math.random() * 1000));
}

module.exports = MessageHandler;