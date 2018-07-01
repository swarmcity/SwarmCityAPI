// content of index.js
const http = require('http');
const PORT = 3000;
const ipfsService = require('./services').ipfsService;
const logs = require('./logs')(module);

const server = http.createServer((request, response) => {
    let hash = request.url.substr(1);
    if (hash && hash.length === 46 && hash.substring(0, 2) === 'Qm') {
        ipfsService.cat(hash).then((data) => {
            if (isBase64(data.toString('utf8'))) {
                response.setHeader('cache-control', 'public, max-age=29030400, immutable');
                let dataImg = data.toString('utf8').replace(/^data:image\/\w+;base64,/, '');
                response.end(new Buffer(dataImg, 'base64'));
            } else {
                response.writeHead(404, {'Content-Type': 'text/plain'});
                response.write('404 Not found');
                response.end();
            }
        });
    } else {
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.write('404 Not found');
        response.end();
    }
});


/**
 * check if is base64 image
 *
 * @param      {Object}   image base64 image
 *
 * @return     {boolean}
 */
function isBase64(image) {
    // eslint-disable-next-line no-useless-escape
    let regex = '/^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i'; // eslint-disable-line max-len
    return regex.test(image);
}

/**
 * start the socket server and start listening
 *
 * @param      {Object}   customConfig cstom config that overrides env
 *
 * @return     {Promise}  resolves with { port , host} when listening
 */
function listen(customConfig) {
	if (!customConfig) {
		customConfig = {};
    }
    return new Promise((resolve, reject) => {
        server.listen(PORT, (err) => {
            if (err) {
                reject(err);
            }
            logs.info('server is listening on %s:%i', PORT);
        });
    });
}

module.exports = {
    listen: listen,
};
