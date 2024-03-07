import Vector from './vector';

export async function wait(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export function range(count: number): Generator<number>;
export function range(
    start: number,
    stop: number,
    step?: number,
): Generator<number>;
export function range(a: number, b?: number, c?: number): Generator<number> {
    const isCountSignature = b === undefined;
    let start: number,
        stop: number,
        step = 1;

    if (isCountSignature) {
        start = 0;
        stop = a;
    } else {
        start = a;
        stop = b;
        if (c) step = c;
    }

    return rangeImpl(start, stop, step);
}

function* rangeImpl(
    start: number,
    stop: number,
    step: number,
): Generator<number> {
    if (start < stop && step > 0) {
        for (let i = start; i < stop; i += step) {
            yield i;
        }
    } else if (start > stop && step < 0) {
        for (let i = start; i > stop; i += step) {
            yield i;
        }
    } else {
        console.error({ start, stop, step });
        throw new Error(`range(...) arguments would cause an infinite loop`);
    }
}

export function ascii(text: string): Uint8Array {
    const data = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code < 0x20 || code >= 0x7f) {
            throw RangeError('Given text is not representable in ASCII');
        }
        data.set([code], i);
    }
    return data;
}

export function isInteger(val: number): boolean {
    return val % 1 == 0;
}

export function assertIsInteger(...args: Parameters<typeof isInteger>): void {
    if (!isInteger(...args)) {
        throw new TypeError('Value is not an integer');
    }
}

export function isWithinBounds(val: number, min: number, max: number): boolean {
    return val >= min && val <= max;
}

export function assertIsWithinBounds(
    ...args: Parameters<typeof isWithinBounds>
): void {
    if (!isWithinBounds(...args)) {
        throw new RangeError('Value is not within bounds');
    }
}

export function callForGrid(size: Vector, fn: (vec: Vector) => void): void {
    for (const x of range(size.x)) {
        for (const y of range(size.y)) {
            fn(new Vector(x, y));
        }
    }
}

export function sum(a: number, b: number): number {
    return a + b;
}

export function max(a: number, b: number): number {
    return Math.max(a, b);
}

export function assertIsElementOf<T>(needle: T, haystack: T[]): void {
    if (!haystack.includes(needle)) {
        throw new Error('Element is not a member of the given array!');
    }
}

export class GridIndexTranslator {
    public size: Vector;
    public constructor(size: Vector) {
        this.size = size;
    }

    public getIndex({ x, y }: Vector): number {
        return y * this.size.x + x;
    }

    public getPosition(index: number): Vector {
        const x = index % this.size.x;
        const y = Math.floor(index / this.size.x);
        return new Vector(x, y);
    }
}
