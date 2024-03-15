import { LaunchpadModel } from '../launchpad/launchpad';
import { StandardLEDColorDefinition } from '../launchpad/ledcolor';
import { callForGrid, range } from '../util';
import Vector from '../vector';
import Component, {
    LocalRenderPixel,
    LocalRenderPixelMaybeColor,
} from './component';
import { LayoutComponent } from './layouts';

export class Canvas {
    public readonly buffer: (number | undefined)[][];
    public readonly size: Vector;

    public constructor(size: Vector) {
        this.size = size;
        this.buffer = createRenderTarget(size);
    }

    public set(position: Vector, color: number): void {
        this.buffer[position.x][position.y] = color;
    }

    public get(position: Vector): number | undefined {
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

export function renderInteractiveComponentToLaunchpad(
    component: Component,
    position: Vector,
    launchpad: LaunchpadModel,
) {
    // Initial render
    const canvas = Canvas.renderComponent(component);
    renderCanvasToLaunchpad(canvas, position, launchpad);

    // Make interactive
    launchpad.addListener('touch', (type, offset) => {
        const componentPosition = offset.sub(position);
        if (
            componentPosition.x >= 0 &&
            componentPosition.x < component.size.x &&
            componentPosition.y >= 0 &&
            componentPosition.y < component.size.y
        ) {
            component.touched(type, componentPosition);
        }
    });

    // Make it partially rerender when requested
    component.requestRender = (componentTrace) => {
        const canvas = Canvas.renderComponent(component, componentTrace);
        renderCanvasToLaunchpad(canvas, position, launchpad);
    };
}

export function renderCanvasToLaunchpad(
    canvas: Canvas,
    position: Vector,
    launchpad: LaunchpadModel,
): void {
    launchpad.setLEDs(
        flattenAndLabelPixelMap(canvas)
            .map((led) => ({
                position: led.position.add(position),
                color: led.color,
            }))
            .filter(notCorners)
            .filter(definedColors)
            .map(
                (led) =>
                    new StandardLEDColorDefinition(
                        positionToIndex(led.position),
                        led.color,
                    ),
            ),
    );
}

function notCorners({ position }: LocalRenderPixelMaybeColor): boolean {
    return ![
        new Vector(0, 0),
        new Vector(9, 0),
        new Vector(0, 9),
        new Vector(9, 9),
    ].some((vec) => vec.equals(position));
}

function definedColors(
    pixel: LocalRenderPixelMaybeColor,
): pixel is LocalRenderPixel {
    return pixel.color !== undefined;
}

export function createRenderTarget(size: Vector): number[][] {
    const pixels = Array<Array<number>>(size.x);
    for (const x of range(pixels.length)) {
        pixels[x] = Array<number>(size.y);
    }
    return pixels;
}

export function flattenAndLabelPixelMap(
    canvas: Canvas,
): LocalRenderPixelMaybeColor[] {
    const renderedPixels = Array<LocalRenderPixelMaybeColor>();
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
        const childColor = childCanvas.get(offset);
        if (childColor) {
            parentCanvas.set(target, childColor);
        }
    });
}

export function positionToIndex(position: Vector): number {
    const launchpadRow = 9 - position.y;
    const launchpadColumn = position.x;

    return 10 * launchpadRow + launchpadColumn;
}
