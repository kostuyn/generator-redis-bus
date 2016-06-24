'use strict';

var args = require('minimist')(process.argv);

var RedisService = require('./services/redis-service');
var getMessage = require('./services/get-message');
var eventHandler = require('./services/event-handler');

var Manager = require('./roles/manager');
var Generator = require('./roles/generator');
var MessageHandler = require('./roles/message-handler');
var ErrorHandler = require('./roles/error-handler');

var msgTimeout = parseInt(args.msgTimeout) || 500;
var host = args.host || 'localhost';
var port = parseInt(args.port) || 6379;

var redisService = new RedisService(host, port);

var manager = new Manager(redisService, msgTimeout);
var generator = new Generator(redisService, manager, getMessage);
var messageHandler = new MessageHandler(redisService, manager, eventHandler);
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



