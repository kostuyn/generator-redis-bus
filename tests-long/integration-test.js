'use strict';

var assert = require('assert');
var redis = require('redis');

var RedisService = require('../services/redis-service');
var Manager = require('../roles/manager');
var Generator = require('../roles/generator');
var MessageHandler = require('../roles/message-handler');
var ErrorHandler = require('../roles/error-handler');

var n = parseInt(process.env.MSG) || 1000;

describe(n + ' messages Test', function () {
    beforeEach(clearDb);
    afterEach(clearDb);

    it('Should be OK', function (done) {
        this.timeout(15000000);
        var count = 0;
        var array = [];
        var getMessage = function () {
            if (count % 1000 == 0) {
                console.log('Processing messages: ' + count);
            }

            if (count == n) {
                managers.forEach(function (manager) {
                    manager.stop();
                });

                console.log('Now find unique..');
                var obj = {};
                var isDuplicate = false;
                for (var i = 0; i < n; i++) {
                    if (obj[i] != undefined) {
                        isDuplicate = true;
                        break;
                    }
                    obj[i] = i;
                }

                assert.equal(array.length, n);
                assert.equal(isDuplicate, false, 'Have duplicate messages');

                done();
                return count++;
            }

            return count++;
        };
        var eventHandler = function (msg, callback) {
            array.push(msg);
            callback(null, msg);
        };

        var managers = [
            startNode(getMessage, eventHandler),
            startNode(getMessage, eventHandler),
            startNode(getMessage, eventHandler),
            startNode(getMessage, eventHandler)
        ];
    });


});

function startNode(getMessage, eventHandler) {
    var expireTimeout = 500;
    var msgTimeout = 0;
    var redisService = new RedisService('localhost', 6379, expireTimeout);

    var manager = new Manager(redisService, msgTimeout, expireTimeout);
    var generator = new Generator(redisService, manager, getMessage);
    var messageHandler = new MessageHandler(redisService, manager, eventHandler);
    var errorHandler = new ErrorHandler(redisService);

    manager.setGenerator(generator);
    manager.setMessageHandler(messageHandler);
    manager.setErrorHandler(errorHandler);

    manager.start(false, function (err) {
        if (err) {
            console.error('Error occurred: ' + err.message);
            console.error(err);
        }

        redisService.close();
    });

    return manager;
}

function clearDb(callback) {
    var client = redis.createClient({host: 'localhost', port: 6379});
    client.del('generator', function (err) {
        client.del('queue', function (err) {
            client.del('term', function (err) {
                client.del('errors', function (err) {
                    callback();
                });
            });
        });
    });
}
