'use strict';

var args = require('minimist')(process.argv);

var RedisService = require('./services/redis-service');
var Manager = require('./roles/manager');
var Generator = require('./roles/generator');
var MessageHandler = require('./roles/message-handler');
var ErrorHandler = require('./roles/error-handler');

var redisService = new RedisService('localhost', 6379);

var manager = new Manager(redisService);
var generator = new Generator(redisService, manager);
var messageHandler = new MessageHandler(redisService, manager);
var errorHandler = new ErrorHandler(redisService);

manager.setGenerator(generator);
manager.setMessageHandler(messageHandler);
manager.setErrorHandler(errorHandler);

manager.start(args.getErrors, function (err) {
    if (err) {
        console.error('Error occurred: ' + err.message);
        console.error(err);
    }

    redisService.close();
});



