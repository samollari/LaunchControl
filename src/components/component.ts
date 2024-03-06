import Vector from "../vector";
import ComponentRenderer from "./renderer";

export type LocalRenderPixel = {
    position: Vector;
    color: number;
};

export default abstract class Component {
    public readonly topLeftCorner: Vector;
    public readonly size: Vector;
    protected renderer: ComponentRenderer;

    public constructor(topLeftCorner: Vector, size: Vector, renderer: ComponentRenderer) {
        this.topLeftCorner = topLeftCorner;
        this.size = size;
        this.renderer = renderer;
    }

    public abstract render(renderTarget: number[][]): void;
}
