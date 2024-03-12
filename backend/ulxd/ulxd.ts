import EventEmitter from 'events';
import { Socket, createConnection } from 'net';

export default class ULXDUnit extends EventEmitter {
    public readonly ip: string;
    private socket: Socket;

    public constructor(ip: string) {
        super();
        this.ip = ip;
        this.socket = createConnection(2202, ip);

        this.socket.on('data', (data) => this.onData(data));
        this.setupConnection();
    }

    private async setupConnection() {
        if (this.socket.connecting) {
            let connectionCallback: () => void;
            const connectionReady = new Promise<void>((resolve) => { connectionCallback = resolve; });
            this.socket.on('connect', () => connectionCallback());
            await connectionReady;
        }

        this.socket.write('< GET 0 ALL >');
        this.socket.write('< SET 0 METER_RATE 00100 >');
    }

    private onData(data: Buffer) {
        const dataString = data.toString();

        for (const message of dataString.slice(2, -1).split('><')) {
            const [type, ...parts] = message.trim().split(' ');
            const channelNumber = Number(parts[0]);

            if (isNaN(channelNumber)) {
                continue;
            }

            switch (type) {
                case 'REP':
                    this.onChRep(channelNumber, parts);
                    break;

                case 'SAMPLE':
                    this.onSample(channelNumber, parts.slice(2));
                    break;
            }
        }
    }

    private onChRep(channel: number, [type, ...values]: string[]): void {
        switch (type) {
            case 'AUDIO_GAIN':
                this.emit('gain', channel, Number(values[0]) - 18);
                break;

            case 'AUDIO_MUTE': {
                const muted = values[0] === 'ON';
                this.emit('muteState', channel, muted);
                // this.emit(muted ? 'mute' : 'unmute', channel);
                break;
            }

            case 'RF_INT_DET': {
                const detected = values[0] === 'CRITICAL';
                this.emit('interferenceState', channel, detected);
                // this.emit(detected ? 'interferenceDetected' : 'interferenceClear', channel);
                break;
            }

            case 'BATT_BARS': {
                this.emit('battBars', channel, Number(values[0]));
                break;
            }
        }
    }

    private onSample(channel: number, [diversityStatus, rfLevel, audioLevel]: string[]): void {
        const diversity = {
            a: diversityStatus.at(0) === 'A',
            b: diversityStatus.at(1) === 'B',
        };
        const rssi = Number(rfLevel) - 128;
        const audioDBFS = Number(audioLevel) - 50;
        this.emit('sample', channel, diversity, rssi, audioDBFS);
    }
}
