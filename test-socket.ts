import { io } from 'socket.io-client';
const socket = io('https://api.vamospool.id', { transports: ['websocket'] });
socket.on('connect', () => { console.log('Connected!'); process.exit(0); });
socket.on('connect_error', (err) => { console.log('Error:', err.message); process.exit(1); });
setTimeout(() => { console.log('Timeout'); process.exit(1); }, 10000);
