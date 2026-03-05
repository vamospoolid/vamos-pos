const { SerialPort } = require('serialport');
console.log('Searching for ports...');
SerialPort.list().then(ports => {
    if (ports.length === 0) {
        console.log('No ports found.');
    } else {
        ports.forEach(p => console.log(`Found: ${p.path} - ${p.friendlyName || p.manufacturer}`));
    }
}).catch(err => {
    console.error('Error listing ports:', err);
});
