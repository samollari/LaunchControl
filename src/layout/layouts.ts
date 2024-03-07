import {
    GridIndexTranslator,
    assertIsElementOf,
    callForGrid,
    max,
    sum,
} from '../util';
import Vector from '../vector';
import Component, { RequestRenderFunction } from './component';
import { Canvas, copyToPosition } from './renderer';

export abstract class LayoutComponent extends Component {
    public readonly components: Component[];

    public constructor(components: Component[], size: Vector) {
        super(size);
        this.components = components;
    }

    public abstract partialRender(
        componentTrace: Component[],
        renderTarget: Canvas,
    ): void;

    public set requestRender(fn: RequestRenderFunction) {
        super.requestRender = fn;
        this.components.forEach((component) => {
            component.requestRender = (children: Component[]) =>
                fn([component, ...children]);
        });
    }

    protected partialRenderRequestedChild(componentTrace: Component[]): Canvas {
        const childComponent = componentTrace[0];
        assertIsElementOf(childComponent, this.components);
        return Canvas.renderComponent(childComponent, componentTrace.slice(1));
    }
}

export class HorizontalLayoutComponent extends LayoutComponent {
    public constructor(components: Component[]) {
        const totalWidth = components
            .map((component) => component.size.x)
            .reduce(sum);
        const maxHeight = components
            .map((component) => component.size.y)
            .reduce(max);
        super(components, new Vector(totalWidth, maxHeight));
    }

    public render(renderTarget: Canvas): void {
        let x = 0;
        for (const component of this.components) {
            const childCanvas = Canvas.renderComponent(component);
            copyToPosition(renderTarget, childCanvas, new Vector(x, 0));
            x += component.size.x;
        }
    }

    public partialRender(
        componentTrace: Component[],
        renderTarget: Canvas,
    ): void {
        const childCanvas = this.partialRenderRequestedChild(componentTrace);
        const x = this.components
            .map((component) => component.size.x)
            .reduce(sum);
        copyToPosition(renderTarget, childCanvas, new Vector(x, 0));
    }
}

export class VerticalLayoutComponent extends LayoutComponent {
    public constructor(components: Component[]) {
        const maxWidth = components
            .map((component) => component.size.x)
            .reduce(max);
        const totalHeight = components
            .map((component) => component.size.y)
            .reduce(sum);
        super(components, new Vector(maxWidth, totalHeight));
    }

    public render(renderTarget: Canvas): void {
        let y = 0;
        for (const component of this.components) {
            const childCanvas = Canvas.renderComponent(component);
            copyToPosition(renderTarget, childCanvas, new Vector(0, y));
            y += component.size.y;
        }
    }

    public partialRender(
        componentTrace: Component[],
        renderTarget: Canvas,
    ): void {
        const childCanvas = this.partialRenderRequestedChild(componentTrace);
        const y = this.components
            .map((component) => component.size.y)
            .reduce(sum);
        copyToPosition(renderTarget, childCanvas, new Vector(0, y));
    }
}

export class GridLayoutComponent extends LayoutComponent {
    public readonly gridDimensions: Vector;
    public readonly gridSize: Vector;

    protected readonly indexTranslator: GridIndexTranslator;

    public constructor(components: Component[], size: Vector) {
        if (components.length > size.x * size.y) {
            throw new TypeError(
                'Grid layout may not have more children than available spaces',
            );
        }
        const maxElementXSize = components
            .map(Component.getSize('x'))
            .reduce(max);
        const maxElementYSize = components
            .map(Component.getSize('y'))
            .reduce(max);
        const gridSize = new Vector(maxElementXSize, maxElementYSize);
        super(components, gridSize.elwiseMult(size));
        this.gridDimensions = size;
        this.gridSize = gridSize;
        this.indexTranslator = new GridIndexTranslator(this.gridDimensions);
    }

    public render(renderTarget: Canvas): void {
        callForGrid(this.gridDimensions, (position) => {
            const childCanvas = Canvas.renderComponent(
                this.components[this.indexTranslator.getIndex(position)],
            );
            copyToPosition(
                renderTarget,
                childCanvas,
                position.elwiseMult(this.gridSize),
            );
        });
    }

    public partialRender(
        componentTrace: Component[],
        renderTarget: Canvas,
    ): void {
        const childCanvas = this.partialRenderRequestedChild(componentTrace);

        const component = componentTrace[0];
        const componentIndex = this.components.findIndex(
            (cmp) => cmp == component,
        );
        const componentPosition =
            this.indexTranslator.getPosition(componentIndex);
        copyToPosition(renderTarget, childCanvas, componentPosition);
    }

    public registerTouchEvent(
        event: 'touchDown' | 'touchUp',
        position: Vector,
    ): void {
        const touchedElementPos = position.elwiseDiv(this.gridSize, true);
        const touchedIndex = this.indexTranslator.getIndex(touchedElementPos);

        const touchedElBasePos = position.elwiseMult(this.gridSize);
        const offset = position.sub(touchedElBasePos);

        this.components[touchedIndex].registerTouchEvent(event, offset);
    }
}
