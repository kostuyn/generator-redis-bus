'use strict';

var sinon = require('sinon');

var Generator = require('../roles/generator');

describe('Generator Test', function () {
    var redisService = {
        touchGenerator: function () {
        },
        sendMessage: function () {
        },
        incTerm: function () {

        },
        checkTerm: function () {

        }
    };

    var manager = {
        switchToMessageHandler: function () {

        },
        msgTimeout: 500,
        touchTimeout: 250,
        checkTimeout: 500
    };

    var clock;
    var sendMsgStub;
    var incTermStub;
    var checkTermStub;
    var touchGeneratorStub;
    var messageCreatorStub;
    var startCallbackSpy;
    var generator;

    var message = 'message from creator';

    beforeEach(function () {
        clock = sinon.useFakeTimers();
        startCallbackSpy = sinon.spy();

        incTermStub = sinon.stub(redisService, 'incTerm').yields(null, 56);
        checkTermStub = sinon.stub(redisService, 'checkTerm').yields(null, true);
        sendMsgStub = sinon.stub(redisService, 'sendMessage').yields(null);
        touchGeneratorStub = sinon.stub(redisService, 'touchGenerator').yields(null);
        messageCreatorStub = sinon.stub().returns(message);

        generator = new Generator(redisService, manager, messageCreatorStub);
    });

    afterEach(function () {
        clock.restore();
        incTermStub.restore();
        checkTermStub.restore();
        sendMsgStub.restore();
        touchGeneratorStub.restore();
    });

    it('Should send msg', function () {
        var n = 15;
        generator.start(startCallbackSpy);

        clock.tick(500 * n);

        sinon.assert.callCount(incTermStub, 1);
        sinon.assert.callCount(checkTermStub, n + 1);
        sinon.assert.callCount(sendMsgStub, n + 1);
        sinon.assert.calledWith(sendMsgStub, message);
    });

    it('Should touch semaphore', function () {
        var n = 34;
        generator.start(startCallbackSpy);

        clock.tick(250 * n);

        sinon.assert.callCount(touchGeneratorStub, n);
    });

    it('Should switch to MessageHandler', function () {
        var n = 21;

        var switchToMessageHandlerSpy = sinon.spy(manager, 'switchToMessageHandler');

        generator.start(startCallbackSpy);

        checkTermStub.yields(null, true);
        clock.tick(500 * n);
        checkTermStub.yields(null, false);
        clock.tick(500 * 12);

        sinon.assert.callCount(checkTermStub, n + 2);
        sinon.assert.calledOnce(switchToMessageHandlerSpy);
        sinon.assert.calledWith(switchToMessageHandlerSpy, startCallbackSpy);
    });
});