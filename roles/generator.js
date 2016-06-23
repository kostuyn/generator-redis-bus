'use strict';

var log = require('debug')('develop');

function Generator(redisService, manager) {
    this._redisService = redisService;
    this._manager = manager;
}

Generator.prototype.start = function (callback) {
    log('Generator is started.');

    var self = this;

    self._isStop = false;
    self._redisService.incTerm(function (err, curTerm) {
        if (err) {
            return callback(err);
        }

        touch.call(self, callback);
        sendMsg.call(self, 0, curTerm, callback);
    });
};

function touch(callback) {
    var self = this;
    setTimeout(function () {
        if (self._isStop) {
            return;
        }

        self._redisService.touchGenerator(function (err) {
            if (err) {
                return callback(err);
            }

            touch.call(self, callback);
        });
    }, 200);
}

function sendMsg(timeout, curTerm, callback) {
    var self = this;
    setTimeout(function () {
        var msg = getMessage.call(self);
        self._redisService.checkTerm(curTerm, function (err, result) {
            if (!result) {
                log('Switch to MessageHandler.');
                self._isStop = true;
                self._manager.messageHandler.start(callback);
                return;
            }

            self._redisService.sendMessage(msg, function (err) {
                if (err) {
                    return callback(err);
                }

                sendMsg.call(self, 500, curTerm, callback);
            });
        });
    }, timeout);
}

function getMessage() {
    this.count = this.count || 0;
    return this.count++;
}

module.exports = Generator;