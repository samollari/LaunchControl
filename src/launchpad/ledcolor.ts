import { SysExComponent } from './midimessages';

export type RGBColor = [number, number, number];

export class StandardLEDColorDefinition implements SysExComponent {
    public readonly ledIndex: number;
    public readonly ledColor: number;

    public constructor(ledIndex: number, ledColor: number) {
        assertIsLEDIndex(ledIndex);
        assertIsStandardColor(ledColor);
        this.ledIndex = ledIndex;
        this.ledColor = ledColor;
    }

    public getSysExRepresentation(): [number, number] {
        return [this.ledIndex, this.ledColor];
    }
}
export class RGBLEDColorDefinition implements SysExComponent {
    public readonly ledIndex: number;
    public readonly red: number;
    public readonly green: number;
    public readonly blue: number;

    public constructor(
        ledIndex: number,
        red: number,
        green: number,
        blue: number,
    ) {
        assertIsLEDIndex(ledIndex);
        assertIsRGBColor([red, green, blue]);
        this.ledIndex = ledIndex;
        this.red = red;
        this.green = green;
        this.blue = blue;
    }

    public getSysExRepresentation(): [number, number, number, number] {
        return [this.ledIndex, this.red, this.blue, this.green];
    }
}

export function isStandardColor(color: number): boolean {
    return color % 1 == 0 && color >= 0 && color <= 127;
}

export function assertIsStandardColor(
    ...args: Parameters<typeof isStandardColor>
): void {
    if (!isStandardColor(...args)) {
        throw RangeError(
            'LED Color must be an integer between 0 and 127 (inclusive)',
        );
    }
}

export function isRGBColor(color: RGBColor): boolean {
    return color.every((val) => val % 1 === 0 && val >= 0 && val <= 63);
}

export function assertIsRGBColor(...args: Parameters<typeof isRGBColor>): void {
    if (!isRGBColor(...args)) {
        throw RangeError('RGB values must be within 0-63 (inclusive)');
    }
}

export function isLEDIndex(index: number): boolean {
    return index % 1 == 0 && index >= 1 && index <= 0x63;
}

export function assertIsLEDIndex(...args: Parameters<typeof isLEDIndex>): void {
    if (!isLEDIndex(...args)) {
        throw RangeError(
            'LED Index must be an integer between 0x01 and 0x63 (inclusive)',
        );
    }
}

export function colorScale(
    scale: { [key: string]: number },
    value: number,
): number {
    const sortedKeys = Object.keys(scale)
        .map((keyStr) => Number(keyStr))
        .toSorted((a, b) => a - b);
    const passedThreshold = sortedKeys.find((threshold) => value >= threshold);
    return passedThreshold ? scale[passedThreshold] : 0;
}
