var sinon = require('sinon');
var ErrorHandler = require('../roles/error-handler');

describe('ErrorHandler Test', function () {
    var redisService = {
        getErrors: function () {

        }
    };

    it('Should get error list', function () {
        var errorHandler = new ErrorHandler(redisService);
        var startCalbackSpy = sinon.spy();
        var getErrorsStub = sinon.stub(redisService, 'getErrors').yields(null, [1, 2, 3]);

        errorHandler.start(startCalbackSpy);

        sinon.assert.calledOnce(getErrorsStub);
        sinon.assert.calledWith(startCalbackSpy, null);
        getErrorsStub.restore();
    });

    it('Should call callback with error', function () {
        var errorHandler = new ErrorHandler(redisService);
        var err = 'error';

        var startCalbackSpy = sinon.spy();
        var getErrorsStub = sinon.stub(redisService, 'getErrors').yields(err);

        errorHandler.start(startCalbackSpy);

        sinon.assert.calledOnce(getErrorsStub);
        sinon.assert.calledWith(startCalbackSpy, err);
        getErrorsStub.restore();
    });
});