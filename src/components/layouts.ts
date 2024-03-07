import { assertIsElementOf, max, sum } from "../util";
import Vector from "../vector";
import Component, { RequestRenderFunction } from "./component";
import { Canvas, copyToPosition } from "./renderer";

export abstract class LayoutComponent extends Component {
    public readonly components: Component[];

    public constructor(components: Component[], size: Vector) {
        super(size);
        this.components = components;
    }

    public abstract partialRender(componentTrace: Component[], renderTarget: Canvas): void;

    public set requestRender(fn: RequestRenderFunction) {
        super.requestRender = fn;
        this.components.forEach(component => {
            component.requestRender = (children: Component[]) => fn([component, ...children]);
        });
    }

    protected prepPartialRender(componentTrace: Component[]): Canvas {
        const myChild = componentTrace[0];
        assertIsElementOf(myChild, this.components);
        return Canvas.renderComponent(myChild, componentTrace.slice(1));
    }
}

export class HorizontalLayoutComponent extends LayoutComponent {

    public constructor(components: Component[]) {
        let totalWidth = components.map(component => component.size.x).reduce(sum);
        let maxHeight = components.map(component => component.size.y).reduce(max);
        super(components, new Vector(totalWidth, maxHeight));
    }


    public render(renderTarget: Canvas): void {
        let x = 0;
        for (let component of this.components) {
            const childCanvas = Canvas.renderComponent(component);
            copyToPosition(renderTarget, childCanvas, new Vector(x, 0));
            x += component.size.x;
        }
    }

    public partialRender(componentTrace: Component[], renderTarget: Canvas): void {
        const childCanvas = this.prepPartialRender(componentTrace);
        let x = this.components.map(component => component.size.x).reduce(sum);
        copyToPosition(renderTarget, childCanvas, new Vector(x, 0));
    }
}
