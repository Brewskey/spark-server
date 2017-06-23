import { createLogger } from "bunyan";
import Promise from "bluebird";


var logger = createLogger({ name: 'Rabbit' });


var rabbit_host = process.env.RABBIT_PORT_5672_TCP_ADDR || '172.22.17.61';
var rabbit_port = process.env.RABBIT_PORT_5672_TCP_PORT || 9998;

logger.info({rabbit_host: rabbit_host, rabbit_port: rabbit_port},'Creating Rabbit connection');

var rabbit_connection;
var amqp = require('amqplib');

var mainchannel;
var queues = {};
var receivers = {};
var new_receivers ;

var pubQ = [];              // Publish Queue, to be processed

/**
 * 
 *  MainQueue
 * 
 */
setInterval(function () {
    if (mainchannel === undefined) return;
    if (pubQ.length > 0) {
        var b, cc = 0;
        while (true) {   // eslint-disable-line no-constant-condition
            cc++; if (cc > 10) break;
            b = pubQ.shift();
            if (!b) break;
            (function (b) {
                var q = b[0];

                if (queues[q] === undefined) {
                    mainchannel.assertQueue(q, {durable: false, arguments  : {
                        'x-message-ttl' : 3*60*1000
                    }}).then(function () {
                        queues[q] = 1;       
                        logger.info({q: q},'Asserted and Send');    
                        mainchannel.sendToQueue(q,new Buffer(JSON.stringify(b[1])));
                    });
                } else {
                    logger.info({q: q},'Send');    
                    mainchannel.sendToQueue(q,new Buffer(JSON.stringify(b[1])));
                }
            })(b);
        }
        
    }
    if (new_receivers !== undefined) {
        logger.info('Registering Receivers');
        receivers = new_receivers;
        for (var i in receivers) {
            (function (i,receivers) {
                mainchannel.assertQueue(i,{durable: false, arguments  : {
                    'x-message-ttl' : 3*60*1000
                }}).then(function (info) {
                    logger.info({info: info},'Registered');
                    mainchannel.consume(info.queue,function (msg) {
                        try {
                            logger.info({q: info.queue},'Got Message');
                            if (this.fnc(msg.content.toString(), function () {
                                // This function is an Explicity acknoledge
                                // You need to return False to make an Async Acknoledge
                                mainchannel.ack(msg);
                            }) !== false ) {
                                mainchannel.ack(msg);
                            }
                        } catch(e) {
                            logger.error({err: e.message, msg: msg, message: this.name},'Error on Executing message receiver');
                        }
                    }.bind({fnc: receivers[i], name: i}),{noAck: false});
                });
            })(i,receivers);
        }
        new_receivers = undefined;  
    }
},200).unref();

var afterConnect = function () {
    logger.info('Was Connected');     
    // Start Publisher
    rabbit_connection.createChannel()
      .then(function(ch) {
        logger.info('Channel Created ...');
        mainchannel = ch;   
        mainchannel.on('error', function (err) {
            logger.error({err: err},'RMQChannel Error');                 
        });
        mainchannel.on('close', function (err) {
            logger.info({err: err},'RMQChannel Channel was closed');
            mainchannel = undefined;                 
        });
      })
      .catch(function (err) {
        mainchannel = undefined;
        logger.error({err: err},'Channel Create Error');
    });
};

var mqRunning = true;

var start = function () {
    amqp.connect('amqp://'+rabbit_host+':'+(''+rabbit_port)+'/?heartbeat=60', {
        clientProperties: {
        product  : 'RabbitConnector',
        platform : ''+(''+require.main.filename).split(/[\/\\]/).splice(-1,1)
        }
    }).then(function (conn) {
        logger.info('Rabbit Connected');
        rabbit_connection = conn;
        rabbit_connection.on('error',function (err) {
            logger.error({err: err.message},'RMQ Error');                 
        });
        rabbit_connection.on('close',function (err) {
            mainchannel = undefined;
            rabbit_connection = undefined;
            queues = {};
            if (receivers !== undefined) {
                new_receivers = receivers;
                receivers = undefined;
            }
            if (mqRunning) {
                logger.error({err: err},'RMQ Closed');  
                if (mqRunning) setTimeout(start,1000);               
            }
        });
        afterConnect();
    })
    .catch(function(err) {
            logger.error({err: err},'Rabbit Not Connected');
            setTimeout(start,1000);    
    });

    process.on('beforeExit',function () {
        mqRunning = false;
        mainchannel = undefined;
        if (rabbit_connection !== undefined) rabbit_connection.close();
    })

};
start();

logger.info ('Started');

var rabbit =  {
          send : function (name,obj) {
              pubQ.push([name,obj]);
          },
          register_receiver: function (obj) {
              new_receivers = obj;
          }    
};

module.exports = rabbit;

