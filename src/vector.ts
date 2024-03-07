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

    public sub(other: Vector): Vector {
        return new Vector(this.x - other.x, this.y - other.y);
    }

    public elwiseMult(other: Vector): Vector {
        return new Vector(this.x * other.x, this.y * other.y);
    }

    public elwiseDiv(other: Vector, floor = false): Vector {
        let x = this.x / other.x;
        let y = this.y / other.y;
        if (floor) {
            x = Math.floor(x);
            y = Math.floor(y);
        }
        return new Vector(x, y);
    }

    public elwiseMod(other: Vector): Vector {
        return new Vector(this.x % other.x, this.y % other.y);
    }

    public equals(other: Vector): boolean {
        return this.x == other.x && this.y == other.y;
    }
}
