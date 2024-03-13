import { Socket } from 'socket.io-client';
import { HorizontalLayoutComponent } from '../../layout/layouts';
import { range } from '../../util';
import ULXDChannelComponent from './channel';
import {
    ServerSentEvents,
    ClientSentEvents,
} from '../../../shared/socketevents';

export default class ULXD4QComponent extends HorizontalLayoutComponent {
    private channelComponents: ULXDChannelComponent[];
    private ip: string;
    private socket: Socket<ServerSentEvents, ClientSentEvents>;

    public constructor(
        ip: string,
        socket: Socket<ServerSentEvents, ClientSentEvents>,
    ) {
        const channels = new Array(4);
        for (const i of range(4)) {
            channels[i] = new ULXDChannelComponent();
        }
        super(channels);
        this.channelComponents = channels;
        this.ip = ip;
        this.socket = socket;

        this.subscribe();
        this.socket.on('connect', () => this.subscribe());

        this.socket.on(
            'sample',
            (deviceIP, channel, diversity, rssi, audioLevel) => {
                if (deviceIP !== this.ip) {
                    return;
                }

                const channelComponent = this.channelComponents[channel - 1];
                channelComponent.setData(diversity, rssi, audioLevel);
            },
        );
    }

    protected subscribe(): void {
        this.socket.emit('SUBSCRIBE', this.ip);
    }
}
