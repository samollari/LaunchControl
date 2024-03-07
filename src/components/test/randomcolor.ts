import { callForGrid } from '../../util';
import Component from '../../layout/component';
import { Canvas } from '../../layout/renderer';

export default class RandomColorComponent extends Component {
    public render(renderTarget: Canvas): void {
        callForGrid(this.size, (offset) => {
            renderTarget.set(offset, Math.floor(Math.random() * 128));
        });
    }
}
