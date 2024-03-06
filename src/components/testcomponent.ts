import { callForGrid } from "../util";
import Vector from "../vector";
import Component from "./component";
import ComponentRenderer from "./renderer";

export default class TestComponent extends Component {
    public constructor(topLeftCorner: Vector, size: Vector, renderer: ComponentRenderer) {
        super(topLeftCorner, size, renderer);
        this.renderer.render(this);
    }

    public render(renderTarget: number[][]): void {
        callForGrid(this.size, (x, y) => {
            renderTarget[x][y] = (y)*8 + x;
        });
    }
}
