import { callForGrid } from '../../util';
import Vector from '../../vector';
import Component from '../../layout/component';
import { Canvas } from '../../layout/renderer';

export default class PalleteTestComponent extends Component {
    public constructor(size: Vector) {
        super(size);
    }

    public render(renderTarget: Canvas): void {
        callForGrid(this.size, (offset) => {
            const { x, y } = offset;
            renderTarget.set(offset, y * 8 + x);
        });
    }
}
