// import { EventsMap } from 'socket.io/dist/typed-events';
import { Diversity } from './ulxdtypes';

export type ServerSentEvents = {
    sample: (
        deviceIP: string,
        channel: number,
        diversity: Diversity,
        rssi: number,
        audioLevel: number,
    ) => void;
    battBars: (deviceIP: string, channel: number, battBars: number) => void;
};

export type ClientSentEvents = {
    SUBSCRIBE: (deviceIP: string) => void;
};
