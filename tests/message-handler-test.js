'use strict';

var sinon = require('sinon');

var MessageHandler = require('../roles/message-handler');

describe('MessageHandler Test', function () {
    var redisService = {
        checkGenerator: function () {
        },
        getMessage: function () {
        },
        logError: function () {
        }
    };

    var manager = {
        switchToGenerator: function () {

        },
        msgTimeout: 500,
        touchTimeout: 250,
        checkTimeout: 500
    };

    var clock;
    var checkGeneratorStub;
    var getMessageStub;
    var logErrorStub;
    var eventHandlerStub;
    var startCallbackSpy;
    var messageHandler;

    beforeEach(function () {

        clock = sinon.useFakeTimers();
        startCallbackSpy = sinon.spy();

        checkGeneratorStub = sinon.stub(redisService, 'checkGenerator').yields(null, true);
        getMessageStub = sinon.stub(redisService, 'getMessage');
        logErrorStub = sinon.stub(redisService, 'logError').yields(null);
        eventHandlerStub = sinon.stub();
        eventHandlerStub.yields(null, 'msg');

        messageHandler = new MessageHandler(redisService, manager, eventHandlerStub);
    });

    afterEach(function () {
        clock.restore();
        checkGeneratorStub.restore();
        getMessageStub.restore();
        logErrorStub.restore();
    });

    it('Should attempt get msg by timeout, if no msg', function () {
        var n = 11;
        getMessageStub.yields(null, null);
        messageHandler.start(startCallbackSpy);

        clock.tick(500 * n);

        sinon.assert.callCount(getMessageStub, n + 1);
    });

    it('Should get all msg without timeout, if msg exists', function () {
        var n = 6;
        for (var i = 0; i < n; i++) {
            getMessageStub.onCall(i).yields(null, 'msg' + i);
        }
        getMessageStub.yields(null, null);

        messageHandler.start(startCallbackSpy);
        clock.tick(n);
        sinon.assert.callCount(getMessageStub, n + 1);
    });

    it('Should save "error" msg', function () {
        var n = 6;
        for (var i = 0; i < n; i++) {
            getMessageStub.onCall(i).yields(null, 'msg' + i);
        }
        getMessageStub.yields(null, null);

        eventHandlerStub.yields('error');
        messageHandler.start(startCallbackSpy);
        clock.tick(n);
        sinon.assert.callCount(logErrorStub, n);
    });

    it('Should check semaphore', function () {
        var n = 34;
        messageHandler.start(startCallbackSpy);

        clock.tick(500 * n);

        sinon.assert.callCount(checkGeneratorStub, n);
    });

    it('Should switch to Generator', function () {
        var n = 7;

        var switchToGeneratorSpy = sinon.spy(manager, 'switchToGenerator');

        messageHandler.start(startCallbackSpy);

        checkGeneratorStub.yields(null, true);
        clock.tick(500 * n);
        checkGeneratorStub.yields(null, false);
        clock.tick(500 * 8);

        sinon.assert.callCount(checkGeneratorStub, n + 1);
        sinon.assert.calledOnce(switchToGeneratorSpy);
        sinon.assert.calledWith(switchToGeneratorSpy, startCallbackSpy);
    });
});