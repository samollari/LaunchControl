import { Server } from 'socket.io';
import ConnectionManager from './ulxd/connectionmanager';
import { ClientSentEvents, ServerSentEvents } from '../shared/socketevents';

const io = new Server<ClientSentEvents, ServerSentEvents>();

io.listen(3000, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

console.log('socket.io server listing');

const connectionManager = new ConnectionManager(io);

io.on('connection', (socket) => {
    console.log(`${socket.id} connected`);
    socket.on('SUBSCRIBE', (device) => {
        console.log(`${socket.id} subscribing to ${device}`);
        socket.join(device);
        connectionManager.registerSocketToDevice(socket, device);
    });

    socket.on('disconnect', () => {
        connectionManager.deregisterSocket(socket);
    });

    // socket.on('GAIN', (device, gain) => {
    //     setDeviceGain(device, gain);
    // });
});
