import { Socket, Server as SocketIOServer } from 'socket.io';

import ULXDDevice from './ulxd stub';
import { ClientSentEvents, ServerSentEvents } from '../../shared/socketevents';

export default class ConnectionManager {
    protected io: SocketIOServer<ClientSentEvents, ServerSentEvents>;

    public constructor(io: SocketIOServer) {
        this.io = io;
    }

    // ==========

    protected getDevice(ip: string): ULXDDevice {
        const storedDevice = this.devices.get(ip);
        if (storedDevice) {
            return storedDevice;
        }

        const newDevice = new ULXDDevice(ip);
        this.devices.set(ip, newDevice);
        return newDevice;
    }

    protected devices = new Map<string, ULXDDevice>();
    protected socketDeviceMap = new Map<string, string[]>();

    public registerSocketToDevice(socket: Socket, deviceIP: string) {
        console.log(`registering ${deviceIP} with socket ${socket.id}`);
        let device = this.devices.get(deviceIP);

        if (!device) {
            console.log(`creating device ${deviceIP}`);
            device = new ULXDDevice(deviceIP);
            this.devices.set(deviceIP, device);

            device.on('sample', (channel, diversity, rssi, audioLevel) => {
                console.log(
                    `sample received for ${deviceIP}`,
                    channel,
                    diversity,
                    rssi,
                    audioLevel,
                );
                this.io
                    .to(deviceIP)
                    .emit(
                        'sample',
                        deviceIP,
                        channel,
                        diversity,
                        rssi,
                        audioLevel,
                    );
            });
            device.on('battBars', (channel, battBars) => {
                console.log(`battBars received for ${deviceIP}`);
                this.io
                    .to(deviceIP)
                    .emit('battBars', deviceIP, channel, battBars);
            });
            device.on('deviceError', (channel) => {
                this.io.to(deviceIP).emit('deviceError', deviceIP, channel);
            });
        }

        const socketDevices = this.socketDeviceMap.get(socket.id) ?? [];
        if (!socketDevices.includes(deviceIP)) {
            socketDevices.push(deviceIP);
        }
        this.socketDeviceMap.set(socket.id, socketDevices);
    }

    protected countDeviceReferences(): { [key: string]: number } {
        const devices = [...this.devices.keys()];
        const allDevices = [...this.socketDeviceMap.values()].flat();
        return Object.fromEntries(
            devices.map((deviceIP) => [
                deviceIP,
                allDevices.filter((value) => value === deviceIP).length,
            ]),
        );
    }

    public deregisterSocket(socket: Socket) {
        console.log(
            `deregistering socket ${socket.id}. running garbage collection`,
        );
        this.socketDeviceMap.delete(socket.id);
        const deviceReferences = this.countDeviceReferences();
        Object.entries(deviceReferences).forEach(([ip, references]) => {
            if (references === 0) {
                console.log(`removing device ${ip}`);
                this.devices.get(ip)?.close();
                this.devices.delete(ip);
            }
        });
    }
}
