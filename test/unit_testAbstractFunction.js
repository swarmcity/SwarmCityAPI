'use strict';

const should = require('should');
const sinon = require('sinon');

const AbstractFunction = require('../src/functions/AbstractFunction');

describe('AbstractFunction', function() {
    it('should have a name and parameters', function() {
        let fut = new AbstractFunction('myFunction', [{
            'name': 'parameter1',
            'description': 'The first parameter',
        }, {
            'name': 'parametertwo',
            'description': 'The second parameter',
        }]);
        should(fut.name()).be.equal('myFunction');
        should(fut.parameters()).be.Array;
    });

    it('should default to no parameters', function() {
        let fut = new AbstractFunction('myFunction');
        should(fut.name()).be.equal('myFunction');
        should(fut.parameters()).be.Array;
    });

    it('should be unhappy when parameters are missing', function() {
        let fut = new AbstractFunction('myFunction', [{
            'name': 'parameter1',
            'description': 'The first parameter',
        }, {
            'name': 'parametertwo',
            'description': 'The second parameter',
        }]);
        let errors = fut.validateData({});
        should(errors.length).be.greaterThan(0);
    });

    it('should be happy when the correct parameters are present', function() {
        let fut = new AbstractFunction('myFunction', [{
            'name': 'parameter1',
            'description': 'The first parameter',
        }, {
            'name': 'parametertwo',
            'description': 'The second parameter',
        }]);
        let errors = fut.validateData({'parameter1': 'one', 'parametertwo': 'two'});
        should(errors.length).be.equal(0);
    });

    it('should not execute when parameters are missing', function() {
        let fut = new AbstractFunction('myFunction', [{
            'name': 'parameter1',
            'description': 'The first parameter',
        }, {
            'name': 'parametertwo',
            'description': 'The second parameter',
        }]);
        let data = {'parameter1': 'one', 'parameter2': 'two'};
        let errors = fut.validateData(data);
        should(errors.length).be.greaterThan(0);
        let spy = sinon.spy();
        fut.execute({}, data, spy);
        should(spy.calledOnce).be.ok;
        should(spy.calledWith({'response': 400, 'data': data, 'errors': errors})).be.ok;
    });


    it('should execute when all is well', function() {
        let fut = new AbstractFunction('myFunction', [{
            'name': 'parameter1',
            'description': 'The first parameter',
        }, {
            'name': 'parametertwo',
            'description': 'The second paramter',
        }]);
        let data = {'parameter1': 'one', 'parametertwo': 'two'};
        let errors = fut.validateData(data);
        should(errors.length).be.equal(0);
        let spy = sinon.spy();
        try {
            fut.execute({}, data, spy);
        } catch (err) {
            should(err).be.ok();
        }
    });
});
