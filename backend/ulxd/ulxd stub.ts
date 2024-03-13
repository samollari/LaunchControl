import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';

import { range } from '../../src/util';

type ULXDEvents = {
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
};

export default class ULXDUnit extends (EventEmitter as new () => TypedEmitter<ULXDEvents>) {
    interval: NodeJS.Timeout;

    public constructor(ip: string) {
        super();

        console.log(`stub for ${ip} created`);

        this.interval = setInterval(() => {
            console.log(`interval fired`);

            for (const channel of range(4)) {
                const diversity = Math.round(Math.random()) == 1 ? 'AX' : 'XB';
                const rfLevel = Math.floor(Math.random() * 256);
                const audioLevel = Math.floor(Math.random() * 256);

                this.onData(
                    Buffer.from(
                        `< SAMPLE ${channel + 1} ALL ${diversity} ${String(rfLevel).padStart(3, '0')} ${String(audioLevel).padStart(3, '0')}`,
                        'ascii',
                    ),
                );
            }

            // }, 250);
        }, 1000);
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
        clearInterval(this.interval);
    }
}
