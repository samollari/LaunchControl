import { TouchEventType } from '../launchpad/launchpad';
import Vector from '../vector';
import { Canvas } from './renderer';

export type LocalRenderPixel = {
    position: Vector;
    color: number;
};

export type RequestRenderFunction = (componentTrace: Component[]) => void;

export default abstract class Component {
    public readonly size: Vector;
    protected _requestRender: RequestRenderFunction | undefined;

    public constructor(size: Vector) {
        this.size = size;
    }

    public abstract render(renderTarget: Canvas): void;

    public get requestRender(): RequestRenderFunction {
        if (!this._requestRender) {
            throw Error(
                'Called requestRender before parent component was initialized',
            );
        }
        return this._requestRender;
    }

    public set requestRender(fn: RequestRenderFunction) {
        if (this._requestRender) {
            throw Error(
                'Component already has a requestRender function defined',
            );
        }
        this._requestRender = fn;
    }

    public touched(eventType: TouchEventType, position: Vector): void {
        console.warn(
            "Component was touched but doesn't have a registered touch handler!",
            { event: eventType, position },
        );
    }

    public static getSize(axis: 'x' | 'y'): (component: Component) => number {
        return (component: Component) => component.size[axis];
    }
}
