const async = require('async');
const {promisify} = require('util');

const maxAttempts = 3;
const pauseTime = 300;
const concurrency = 20;

const ipfsService = require('../services').ipfsService;

const q = async.queue(function(task, callback) {
    // async.retry just wraps the task, execute it once.
    async.retry(1, task, callback);
    // task()
    // .then(
    //     res => callback(null, res),
    //     err => callback(err)
    // )
}, concurrency);

const pushTaskAsync = promisify(q.push);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const wrapTask = async (task) => {
    let attempt = 0;
    let err;
    while (attempt++ <= maxAttempts) {
        try {
            return await pushTaskAsync(task);
        } catch (e) {
            err = e;
        }
        if (attempt < maxAttempts) {
            await wait(pauseTime*attempt);
        }
    }
    throw err;
};

const add = (payload) => wrapTask(async () => await ipfsService.add(payload));
const cat = (hash) => wrapTask(async () => await ipfsService.cat(hash));

module.exports = {
    add,
    cat,
};
