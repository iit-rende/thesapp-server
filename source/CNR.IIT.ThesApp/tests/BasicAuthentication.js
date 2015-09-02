var should = require('should');
var auth = require('../services/BasicAuthentication').configureAuth({ user: "password" });

describe('BasicAuthentication', function () {
    it('should not call the next middleware in the pipeline and should instead send a 401 Unauthorized status code and add the challenge header to the response if no Authorization header was provided with the request', function () {
        var code = 0;
        var nextCalled = false;
        var headers = {};
        var res = { send: function (statusCode) { code = statusCode; }, set: function (name, value) { headers[name] = value; } };
        var req = { headers: {} };

        auth(req, res, function () { nextCalled = true; });
        
        nextCalled.should.equal(false);
        code.should.equal(401);
        headers.should.have.property('WWW-Authenticate', 'Basic realm=Autenticazione richiesta');

    });


    it('should not call the next middleware in the pipeline and should instead send a 401 Unauthorized status code and add the challenge header to the response if a wrong username and password were provided in the Authorization header', function () {
        var code = 0;
        var headers = { authorization: "Basic dXNlcjp3cm9uZ1Bhc3N3b3Jk" }; //user:wrongPassword
        var nextCalled = false;
        var res = { send: function (statusCode) { code = statusCode; }, set: function (name, value) { headers[name] = value; } };
        var req = { headers: headers };
        
        auth(req, res, function () { nextCalled = true; });
        
        nextCalled.should.equal(false);
        code.should.equal(401);
        headers.should.have.property('WWW-Authenticate', 'Basic realm=Autenticazione richiesta');

    });

    it('should call the next middleware when the correct username and password are provided with the Authorization request header', function () {
        var headers = { authorization: "Basic dXNlcjpwYXNzd29yZA==" }; //user:password
        var nextCalled = false;
        var res = { };
        var req = { headers: headers };
        
        auth(req, res, function () { nextCalled = true; });
        nextCalled.should.equal(true);

    });

});