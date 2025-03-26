import { Socket } from 'socket.io-client';
import Component from '../../layout/component';
import { Canvas } from '../../layout/renderer';
import {
    ClientSentEvents,
    ServerSentEvents,
} from '../../../shared/socketevents';
import Vector from '../../vector';
import { TouchEventType } from '../../launchpad/launchpad';

export default class SimpleOSCButton extends Component {
    private currentlyPressed = false;

    public constructor(
        public readonly targetIP: string,
        public readonly targetPort: number,
        public readonly targetPath: string,
        public readonly targetArguments: string[],
        public readonly unpressedColor: number,
        protected readonly socket: Socket<ServerSentEvents, ClientSentEvents>,
    ) {
        super(new Vector(1, 1));
    }

    // protected setupOSCConnection(): void {
    //     // this.socket.emit('OSC_INIT', this.targetIP, this.targetPort);
    // }

    public touched(eventType: TouchEventType, position: Vector): void {
        if (position.x !== 0 || position.y !== 0) {
            return;
        }
        this.currentlyPressed = eventType === 'touchDown';
        if (this.currentlyPressed) {
            this.socket.emit(
                'OSC_SEND',
                this.targetIP,
                this.targetPort,
                this.targetPath,
                this.targetArguments,
            );
        }
        this.requestRender([]);
    }

    public render(renderTarget: Canvas): void {
        renderTarget.set(
            new Vector(0, 0),
            this.currentlyPressed ? 3 : this.unpressedColor,
        );
    }
}
