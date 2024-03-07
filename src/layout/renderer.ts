import { LaunchpadModel } from '../launchpad/launchpad';
import { StandardLEDColorDefinition } from '../launchpad/ledcolor';
import { callForGrid, range } from '../util';
import Vector from '../vector';
import Component, { LocalRenderPixel } from './component';
import { LayoutComponent } from './layouts';

export class Canvas {
    public readonly buffer: number[][];
    public readonly size: Vector;

    public constructor(size: Vector) {
        this.size = size;
        this.buffer = createRenderTarget(size);
    }

    public set(position: Vector, color: number): void {
        this.buffer[position.x][position.y] = color;
    }

    public get(position: Vector): number {
        return this.buffer[position.x][position.y];
    }

    public static renderComponent(
        component: Component | LayoutComponent,
        componentTrace?: Component[],
    ): Canvas {
        const canvas = new Canvas(component.size);
        if (
            'partialRender' in component &&
            componentTrace !== undefined &&
            componentTrace.length > 0
        ) {
            component.partialRender(componentTrace, canvas);
        } else {
            if ('partialRender' in component) {
                console.warn(
                    'Full rendering layout component due to empty or undefined component trace',
                );
            }
            component.render(canvas);
        }
        return canvas;
    }
}

export function renderComponentToLaunchpad(
    component: Component,
    position: Vector,
    launchpad: LaunchpadModel,
): void {
    const canvas = Canvas.renderComponent(component);
    launchpad.setLEDs(
        flattenAndLabelPixelMap(canvas)
            .filter(notCorners)
            .map(
                (led) =>
                    new StandardLEDColorDefinition(
                        positionToIndex(led.position.add(position)),
                        led.color,
                    ),
            ),
    );
}

function notCorners({ position }: LocalRenderPixel): boolean {
    return ![
        new Vector(0, 0),
        new Vector(9, 0),
        new Vector(0, 9),
        new Vector(9, 9),
    ].some((vec) => vec.equals(position));
}

export function createRenderTarget(size: Vector): number[][] {
    const pixels = Array<Array<number>>(size.x);
    for (const x of range(pixels.length)) {
        pixels[x] = Array<number>(size.y);
    }
    return pixels;
}

export function flattenAndLabelPixelMap(canvas: Canvas): LocalRenderPixel[] {
    const renderedPixels = Array<LocalRenderPixel>();
    callForGrid(canvas.size, (position) => {
        renderedPixels.push({
            position: position,
            color: canvas.get(position),
        });
    });
    return renderedPixels;
}

export function copyToPosition(
    parentCanvas: Canvas,
    childCanvas: Canvas,
    position: Vector,
) {
    callForGrid(childCanvas.size, (offset) => {
        const target = position.add(offset);
        parentCanvas.set(target, childCanvas.get(offset));
    });
}

export function positionToIndex(position: Vector): number {
    const launchpadRow = 9 - position.y;
    const launchpadColumn = position.x;

    return 10 * launchpadRow + launchpadColumn;
}
