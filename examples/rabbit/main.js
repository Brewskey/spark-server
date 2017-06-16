"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bunyan_1 = require("bunyan");
var Particle = require("particle-api-js");
var rabbit = require("./rabbit");
var log = bunyan_1.createLogger({ name: 'RConnect' });
var particle = new Particle({
    baseUrl: "" + process.env.rabc_sparkserver,
    clientId: 'CLI2',
    clientSecret: 'client_secret_here'
});
function globalLog(log) {
    rabbit.send('GLOBAL_LOG', { server: sparkServerName, log: log });
}
;
var token;
var eventStream;
var sparkServerName = ('' + process.env.rabc_sparkserver).replace(/http[s]*\:\/\//, '');
function gotEvent(eventname, data) {
    log.info({ name: '' + eventname, data: data }, 'Event');
    rabbit.send('EV_' + eventname, data);
}
log.info({}, 'Starting up');
particle.login({ username: '' + process.env.rabc_username, password: '' + process.env.rabc_password })
    .then(function (data) {
    log.info({ body: data.body }, 'Login Completed');
    token = data.body.access_token;
    globalLog({ state: 'CONNECTED' });
    particle.getEventStream({ deviceId: 'mine', auth: token })
        .then(function (stream) {
        globalLog({ state: 'STREAMING' });
        eventStream = stream;
        stream.on('event', function (data) {
            var edata;
            if (data.data[0] === '{') {
                try {
                    edata = JSON.parse(data.data);
                }
                catch (err) {
                    edata = { plain: data.data };
                }
            }
            else {
                edata = { plain: data.data };
            }
            ;
            gotEvent(data.name, { name: data.name, server: '' + sparkServerName, devicedid: data.coreid, data: edata });
        });
        stream.on('error', function (err) {
            log.error({ e: err }, 'Stream has processed error');
            process.exit(3);
        });
        stream.on('end', function () {
            log.error('EventStream was Closed, or forced to close!');
            process.exit(2);
        });
    })
        .catch(function (err) {
        log.error({ err: err }, 'Error on getting stream');
    });
})
    .catch(function (err) {
    log.error({ err: err.body }, 'Error on login to spark-server');
    // Just exit with an error code, cause the server is restarted by the
    // surrounding system if needed!
    process.exit(1);
});
var incomming = {};
incomming['INCOMING_' + sparkServerName] = function (event) {
    log.info({ event: event }, 'Got incoming event');
};
rabbit.register_receiver(incomming);
process.on('SIGINT', function () {
    process.exit(0);
});
log.info('Init Done.');
globalLog({ state: 'INIT DONE' });
//# sourceMappingURL=main.js.map