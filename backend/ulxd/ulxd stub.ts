import { range } from '../../src/util';
import { AbstractULXDUnit } from './ulxd';

export default class ULXDUnit extends AbstractULXDUnit {
    interval: NodeJS.Timeout;

    public constructor(ip: string) {
        super(ip);

        console.log(`stub for ${ip} created`);

        this.interval = setInterval(() => {
            // console.log(`interval fired`);

            for (const channel of range(4)) {
                const diversityStatus = Math.round(Math.random() * 3);
                const diversity =
                    diversityStatus == 0
                        ? 'XX'
                        : diversityStatus == 1
                          ? 'AX'
                          : 'XB';
                const rfLevel = Math.floor(Math.random() * 256);
                const audioLevel = Math.floor(Math.random() * 50);

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

        for (const message of dataString.slice(2).split('><')) {
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

    public flash(channel: number): void {
        console.log(`STUB: flashing channel ${channel}`);
    }
}
