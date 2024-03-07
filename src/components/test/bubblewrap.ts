import { TouchEventType } from '../../launchpad/launchpad';
import Component from '../../layout/component';
import { Canvas } from '../../layout/renderer';
import Vector from '../../vector';

export default class BubbleWrapComponent extends Component {
    private popped = false;

    public constructor() {
        super(new Vector(1, 1));
    }

    public render(renderTarget: Canvas): void {
        renderTarget.set(new Vector(0, 0), this.popped ? 0 : 3);
    }

    public touched(event: TouchEventType): void {
        if (event === 'touchDown') {
            this.popped = true;
            this.requestRender([]);
        }
    }
}
