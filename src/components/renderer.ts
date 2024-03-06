import { LaunchpadModel } from "../launchpad";
import { StandardLEDColorDefinition } from "../ledcolor";
import { assertIsInteger, assertIsWithinBounds, callForGrid, range } from "../util";
import Vector from "../vector";
import Component, { LocalRenderPixel } from "./component";

export default class ComponentRenderer {
    protected launchpad: LaunchpadModel;

    public constructor(launchpad: LaunchpadModel) {
        this.launchpad = launchpad;
    }

    public render(component: Component) {
        let pixels = Array<Array<number>>(component.size.x);
        for (let x of range(pixels.length)) {
            pixels[x] = Array<number>(component.size.y);
        }
        component.render(pixels);
        this.launchpad.setLEDs(
            flattenAndLabelPixelMap(pixels, component.size).map(led =>
                new StandardLEDColorDefinition(
                    positionToIndex(
                        transposeToGlobalCoordinates(
                            component,
                            led.position
                        )
                    ),
                    led.color
                )
            )
        );
    }

}

export function flattenAndLabelPixelMap(pixelMap: number[][], size: Vector): LocalRenderPixel[] {
    let renderedPixels = Array<LocalRenderPixel>();
    callForGrid(size, (x, y) => {
        renderedPixels.push({
            position: new Vector(x, y),
            color: pixelMap[x][y]
        });
    });
    return renderedPixels;
}

export function transposeToGlobalCoordinates(component: Component, offset: Vector): Vector {
    assertIsInteger(offset.x);
    assertIsInteger(offset.y);
    assertIsWithinBounds(offset.x, 0, component.size.x - 1);
    assertIsWithinBounds(offset.y, 0, component.size.y - 1);

    return component.topLeftCorner.add(offset);
}

export function positionToIndex(position: Vector): number {
    const launchpadRow = 9-position.y;
    const launchpadColumn = position.x;

    return 10*launchpadRow + launchpadColumn;
}
