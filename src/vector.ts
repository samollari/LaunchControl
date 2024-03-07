export default class Vector {
    public readonly x: number;
    public readonly y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public add(other: Vector): Vector {
        return new Vector(this.x + other.x, this.y + other.y);
    }
}
