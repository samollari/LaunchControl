import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { Socket, createConnection } from 'net';

export type ULXDEvents = {
    gain: (channel: number, gainDB: number) => void;
    muteState: (channel: number, muted: boolean) => void;
    interferenceState: (channel: number, interferenceDetected: boolean) => void;
    battBars: (channel: number, battBars: number) => void;
    sample: (
        channel: number,
        diversity: { a: boolean; b: boolean },
        rssi: number,
        audioDBFS: number,
    ) => void;
    deviceError: (channel?: number) => void;
};

export abstract class AbstractULXDUnit extends (EventEmitter as new () => TypedEmitter<ULXDEvents>) {
    public abstract close(): void;

    public constructor(public readonly ip: string) {
        super();
    }
}

export default class ULXDUnit extends AbstractULXDUnit {
    private socket: Socket;

    public constructor(ip: string) {
        super(ip);
        this.socket = createConnection(2202, ip);

        this.socket.on('data', (data) => this.onData(data));
        this.setupConnection();
        this.socket.on('close', (error) => {
            if (error) {
                this.emit('deviceError');
            }
        });
    }

    private async setupConnection() {
        if (this.socket.connecting) {
            let connectionCallback: () => void;
            const connectionReady = new Promise<void>((resolve) => {
                connectionCallback = resolve;
            });
            this.socket.on('connect', () => connectionCallback());
            await connectionReady;
        }

        // this.socket.write('< GET 0 ALL >');
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

    private onSample(
        channel: number,
        [diversityStatus, rfLevel, audioLevel]: string[],
    ): void {
        const diversity = {
            a: diversityStatus.at(0) === 'A',
            b: diversityStatus.at(1) === 'B',
        };
        const rssi = Number(rfLevel) - 128;
        const audioDBFS = Number(audioLevel) - 50;
        this.emit('sample', channel, diversity, rssi, audioDBFS);
    }

    public close() {
        this.socket.destroy();
    }
}
