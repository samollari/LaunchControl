import { callForGrid } from "../util";
import Component from "./component";

export default class ULXD4QComponent extends Component {
    public render(renderTarget: number[][]): void {
        callForGrid(this.size, (x, y) => {
            renderTarget[x][y] = Math.floor(Math.random() * 128);
        });
    }
}
