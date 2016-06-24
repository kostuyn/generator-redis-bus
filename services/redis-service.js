'use strict';

var redis = require('redis');
var log = require('debug')('develop');

function RedisService(host, port, expireTimeout) {
    this._client = redis.createClient({host: host, port: port});
    this._client.on('error', function (err) {
        console.log('Redis error occurred: ' + err.message);
    });

    this._expireTimeout = expireTimeout;
}

RedisService.prototype.touchGenerator = function (callback) {
    this._client.pexpire('generator', this._expireTimeout, function (err, result) {
        log('touch: ' + result);
        callback(err);
    });
};

RedisService.prototype.checkGenerator = function (callback) {
    this._client.set('generator', 'exist', 'px', this._expireTimeout, 'nx', function (err, result) {
        log('check: ' + result);
        if (err) {
            return callback(err);
        }

        callback(null, !result);
    });
};

RedisService.prototype.incTerm = function (callback) {
    this._client.incr('term', function (err, result) {
        callback(err, result);
    });
};

RedisService.prototype.checkTerm = function (curTerm, callback) {
    this._client.get('term', function (err, term) {
        if (err) {
            return callback(err);
        }

        var result = curTerm == term;
        callback(null, result);
    });
};

RedisService.prototype.sendMessage = function (msg, callback) {
    this._client.rpush('queue', msg, function (err, result) {
        log('send msg: ' + msg);
        callback(err, result);
    });
};

RedisService.prototype.getMessage = function (callback) {
    this._client.lpop('queue', function (err, result) {
        log('get msg: ' + result);
        callback(err, result);
    });
};

RedisService.prototype.logError = function (msg, callback) {
    this._client.rpush('errors', msg, function (err, result) {
        callback(err, result);
    });
};

RedisService.prototype.getErrors = function (callback) {
    this._client
        .multi()
        .lrange('errors', 0, -1)
        .del('errors')
        .exec(function (err, replies) {
            if (err) {
                return callback(err);
            }

            callback(null, replies[0]);
        });
};

RedisService.prototype.close = function () {
    this._client.quit();
};

module.exports = RedisService;