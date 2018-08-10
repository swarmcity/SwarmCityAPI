const dbService = require('../services').dbService;
const eventBus = require('../eventBus');

// Without console.log statments: 10000-12000 / s
// With console.log statments: 3000-4000 / s

/* eslint-disable no-console */

const init = async () => {
    const n = 10000;
    console.time(n+' elements');
    for (let i=0; i < n; i++) {
        await dbService
        .set('aaa2', 'hello '+i)
        .then(() => {
            // dbService.get('aaa2').then(console.log);
        });
    }
    console.timeEnd(n+' elements');
};

init();

// Receibe dbChanges
eventBus.on('dbChange', (key, data) => {
    // console.log('key: '+key+', data: '+data);
});

/* eslint-enable no-console */


