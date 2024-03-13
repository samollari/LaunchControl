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

                const channelComponent = this.getChannel(channel);
                channelComponent.setData(diversity, rssi, audioLevel);
            },
        );

        this.socket.on('deviceError', (deviceIP, channel) => {
            if (deviceIP !== this.ip) {
                return;
            }

            if (channel) {
                this.getChannel(channel).hasError();
            } else {
                this.errorAllChannels();
            }
        });

        this.socket.on('disconnect', () => {
            this.errorAllChannels();
        });
    }

    protected subscribe(): void {
        this.socket.emit('SUBSCRIBE', this.ip);
    }

    protected getChannel(channel: number): ULXDChannelComponent {
        return this.channelComponents[channel - 1];
    }

    protected errorAllChannels() {
        for (const channelComponent of this.channelComponents) {
            channelComponent.hasError();
        }
    }
}
