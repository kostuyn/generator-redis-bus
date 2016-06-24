'use strict';

var assert = require('assert');
var _ = require('underscore');
var redis = require('redis');

var RedisService = require('../services/redis-service');
var Manager = require('../roles/manager');
var Generator = require('../roles/generator');
var MessageHandler = require('../roles/message-handler');
var ErrorHandler = require('../roles/error-handler');


describe('1000000 messages Test', function () {

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

    beforeEach(clearDb);

    it('Should be OK', function (done) {
        function startNode(getMessage, eventHandler) {
            var redisService = new RedisService('localhost', 6379);

            var manager = new Manager(redisService, 0);
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
        }


        this.timeout(15000000);
        var n = 1000000;
        var count = 0;
        var array = [];
        var getMessage = function () {
            if (count >= n) {
                array = _.uniq(array);
                //console.log(array);
                assert.equal(array.length, n);
                done();
                return;
            }

            return count++;
        };
        var eventHandler = function (msg, callback) {
            array.push(msg);
            callback(null, msg);
        };

        startNode(getMessage, eventHandler);
        startNode(getMessage, eventHandler);
        startNode(getMessage, eventHandler);
        startNode(getMessage, eventHandler);
    });


});