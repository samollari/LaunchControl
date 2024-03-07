import { callForGrid } from "../util";
import Component from "./component";
import { Canvas } from "./renderer";

export default class ULXD4QComponent extends Component {
    public render(renderTarget: Canvas): void {
        callForGrid(this.size, (offset) => {
            renderTarget.set(offset, Math.floor(Math.random() * 128));
        });
    }
}
