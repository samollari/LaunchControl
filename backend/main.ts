import { Server } from 'socket.io';
import ConnectionManager from './ulxd/connectionmanager';
import { ClientSentEvents, ServerSentEvents } from '../shared/socketevents';
import OSC from 'osc';

const io = new Server<ClientSentEvents, ServerSentEvents>();
const osc = new OSC.UDPPort({
    localAddress: '0.0.0.0',
    localPort: '51331',
});

io.listen(3000, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

osc.open();
osc.on('ready', () => {
    console.log('OSC server listening on :51331');
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

    socket.on('FLASH', (device, channel) => {
        console.log(`${socket.id} flashing ${device} channel ${channel}`);
        connectionManager.getDevice(device).flash(channel);
    });

    socket.on('disconnect', () => {
        connectionManager.deregisterSocket(socket);
    });

    socket.on('OSC_SEND', (deviceIP, port, path, args) => {
        console.log(`Sending OSC to ${deviceIP}:${port} ${path} ${args}`);
        osc.send(
            {
                address: path,
                args: args,
            },
            deviceIP,
            port,
        );
    });

    // socket.on('GAIN', (device, gain) => {
    //     setDeviceGain(device, gain);
    // });
});
