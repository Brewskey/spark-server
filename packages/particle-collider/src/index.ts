import App from './App';

process.on('uncaughtException', (exception: Error) => {
  console.error('uncaughtException', {
    message: exception.message,
    stack: exception.stack,
  }); // logging with MetaData
});

const app = new App();
app.run();

// const serverUrl = '192.168.0.175';
//
// const device = new TCPDevice(serverUrl, 5683);
//
// device.connect();
