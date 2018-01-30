'use strict';

const logger = require('../logs')(module);

const util = require('util');

class AbstractFunction {
    constructor(name, parameters) {
        this._name = name;
        this._parameters = parameters || [];
    }

    /**
     * returns name (verb) of this function
     * @return  {String}   Name of the function
     */
    name() {
        return this._name;
    }

    /**
     * What parameters does the function accept?
     * @return  {Array}     Array of parameters.
     */
    parameters() {
        return this._parameters;
    }

    execute(socket, data, callback) {
        let errors = this.validateData(data);
        if (errors.length) {
            let reply = {
                response: 400,
                data: data,
                error: 'Bad Request. Some of the parameters you passed are invalid.',
                errors: errors,
            };
            return callback(reply);
        }
        this.createTask(socket, data, callback);
    }

    validateData(data) {
        let errors = [];
        this._parameters.forEach((p) => {
            if (!(p.name in data)) {
                errors.push(util.format('Parameter %s is missing.', p.name));
            }
        });
        return errors;
    }

    createTask(socket, data, callback) {
        throw new Error('Not implemented yet.');
    }
}

module.exports = AbstractFunction;
