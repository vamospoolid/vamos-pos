import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket.IO] New connection: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`[Socket.IO] Disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        console.warn('Socket.io is not initialized yet!');
    }
    return io;
};
