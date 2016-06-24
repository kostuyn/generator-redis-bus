'use strict';

var log = require('debug')('develop');

function Generator(redisService, manager, getMessage) {
    this._redisService = redisService;
    this._manager = manager;
    this._getMessage = getMessage;
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


Generator.prototype.stop = function () {
    log('Generator is stopped.');
    this._isStop = true;
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
    }, self._manager.touchTimeout);
}

function sendMsg(timeout, curTerm, callback) {
    var self = this;
    setTimeout(function () {
        self._redisService.checkTerm(curTerm, function (err, result) {
            if (!result) {
                log('Switch to MessageHandler.');
                self.stop();
                self._manager.switchToMessageHandler(callback);
                return;
            }

            var msg = self._getMessage();
            self._redisService.sendMessage(msg, function (err) {
                if (err) {
                    return callback(err);
                }

                sendMsg.call(self, self._manager.msgTimeout, curTerm, callback);
            });
        });
    }, timeout);
}

module.exports = Generator;