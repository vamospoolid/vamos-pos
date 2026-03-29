const { SerialPort } = require('serialport'); SerialPort.list().then(list => console.log('PORTS:', list)).catch(e => console.error('ERROR:', e.message));
