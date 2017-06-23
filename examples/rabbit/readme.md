

# Rabbit connector

* include a messaging server (rabbit MQ) into a spark server solution

# Start

npm install will install all dependencies.

since BUNYAN is required please install bunyan-cli globaly
```
npm install -g bunyan
```

during development you also need to install the typescript compiler

```
npm install -g typescript
```

To use the connector a RabbitInstance needs to be running in your enviroment.
If you are using docker, an instance can be simpley started using

```
docker run -p 9999:15672 -p 9998:5672 -d --hostname rabbit --name rabbit rabbitmq:3-management
```
> Rabbit provides an excellent Management interface to look into the queues. Simply browse to your Rabbit server on port 9999 [http://rabbit:9999](http://rabbit:9999)

You also need a running sparkserver. (you can also startup a sparkserver using [https://hub.docker.com/r/keatec/spark-server/](https://hub.docker.com/r/keatec/spark-server/)) 



# Running from Commandline
A one-liner could be:

**UNIX**
```
export RABBIT_PORT_5672_TCP_ADDR="<rabbitip>" RABBIT_PORT_5672_TCP_PORT="<rabbitport>" rabc_sparkserver="http://<yourserver>:<yourport>" rabc_username="<username>" rabc_password="<password>"; npm start
```

**Windows**
```
set "RABBIT_PORT_5672_TCP_ADDR=<rabbitip>" && set "RABBIT_PORT_5672_TCP_PORT=<rabbitport>"  "rabc_sparkserver=http://<yourserver>:<yourport>" && set "rabc_username=<username>" && set "rabc_password=<password>" && npm start
```

If running inside a Docker system these startup connects automatically to RUNNING DOCKER containers 

* **SPARKSERVER** (running sparkserver) 
* **RABBIT** (running rabbit MQ Server) 


> We use this kind of parameter start cause this is designed to be run on automated enviroments like DOCKER, AZURECLOUD etc. This is the prefered way to do these things

# Running inside docker

## 1. Build the image
You can skip this step and go directly to 2. (the image will be read from docker.hub) 
```
    npm run docker:compile
```
This will build an image called ```keatec/rabbitconnect:latest``` inside your container

## 2. Start an instance

You can simply call the script provided. (please ensure a "rabbit" instance and a "sparkserver" instance is running)

```
    ./docker_run.sh <username_for_sparkserver> <password>
```


## Done
* login to server using credentials from enviroment
* output all events to log
* process all incoming events from Spark-Server into message queues
* GLOBAL_LOG Queue
* Incoming QUEUE per Connector top process (started...)
## Todo

* use rabbit to collect and process commands to and from spark-Server (like flashing, functions , etc)

