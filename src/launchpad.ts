import { RGBColor, RGBLEDColorDefinition, StandardLEDColorDefinition, assertIsLEDIndex, assertIsRGBColor, assertIsStandardColor, isStandardColor } from "./ledcolor";
import { SysExMessage } from "./midimessages";
import { ascii } from "./util";

export enum LaunchpadStatus {
    UNINITIALIZED,
    INITIALIZING,
    READY,
    PROBLEM
}

export enum Mode {
    ABLETON = 0x00,
    STANDALONE = 0x01
}

export enum Layout {
    NOTE = 0x00,
    DRUM = 0x01,
    FADER = 0x02,
    PROGRAMMER = 0x03
}

enum GridSize {
    TEN_BY_TEN = 0,
    EIGHT_BY_EIGHT = 1
}

enum FaderType {
    VOLUME = 0,
    PAN = 1
}

type FaderConfig = {
    number: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
    type: FaderType,
    color: number,
    initialValue: number
};

export interface LaunchpadModel {
    get status(): LaunchpadStatus;
    set mode(mode: Mode);
    set layout(layout: Layout);

    setLEDs(leds: StandardLEDColorDefinition[]): void;
    setLEDsRGB(leds: RGBLEDColorDefinition[]): void;
    setColumn(column: number, colors: number[]): void;
    setRow(row: number, colors: number[]): void;
    fill(color: number): void;
    clear(): void;
    setGrid(size: GridSize, colors: RGBColor[]): void;
    flashLEDs(leds: StandardLEDColorDefinition[]): void;
    pulseLEDs(leds: StandardLEDColorDefinition[]): void;
    scrollText(color: number, loop: boolean, textParts: {speed: number, text: string}[]): void;
    stopTextScroll(): void;
    faderSetup(faders: FaderConfig[]): void;
}

export default class Launchpad implements LaunchpadModel {
    public readonly input: MIDIInput;
    public readonly output: MIDIOutput;
    protected _status: LaunchpadStatus;


    public constructor(input: MIDIInput, output: MIDIOutput) {
        this._status = LaunchpadStatus.UNINITIALIZED;
        this.input = input;
        this.output = output;
        [input, output].forEach((port: MIDIPort) => {
            port.addEventListener('statechange', () => {
                console.log(`${port.name} is now ${port.state}`);
                const allOk = this.input.state === 'connected' && this.output.state === 'connected';
                if (this._status !== LaunchpadStatus.UNINITIALIZED && this._status !== LaunchpadStatus.INITIALIZING) {
                    this._status = allOk ? LaunchpadStatus.READY : LaunchpadStatus.PROBLEM;
                }
            });
        });
        input.addEventListener('midimessage', e => {
            const {data} = e as MIDIMessageEvent;
            console.log('MIDI Message', data);
        });
    }

    public async init() {
        this._status = LaunchpadStatus.INITIALIZING;
        try {
            await Promise.all([
                this.input.open(),
                this.output.open()
            ]);
        } catch (e) {
            this._status = LaunchpadStatus.PROBLEM;
            throw e;
        }
        this._status = LaunchpadStatus.READY;
    }

    get status(): LaunchpadStatus {
        return this._status;
    }

    set mode(mode: Mode) {
        this.output.send(new SysExMessage(0x2D, [mode]));
    }

    set layout(layout: Layout) {
        this.output.send(new SysExMessage(0x2C, [layout]));
    }

    public setLEDs(leds: StandardLEDColorDefinition[]): void {
        if (leds.length == 0 || leds.length > 97) {
            throw TypeError('setLEDs must define between 1 and 97 LED colors (inclusive)');
        }
        this.output.send(new SysExMessage(0x0A, [...leds.flatMap(def => def.getSysExRepresentation())]))
    }

    public setLEDsRGB(leds: RGBLEDColorDefinition[]): void {
        if (leds.length == 0 || leds.length > 78) {
            throw TypeError('setLEDsRGB must define between 1 and 78 LED colors (inclusive)');
        }
        this.output.send(new SysExMessage(0x0B, [...leds.flatMap(def => def.getSysExRepresentation())]));
    }

    public setColumn(column: number, colors: number[]): void {
        if (column < 0 || column > 9) {
            throw RangeError('Column must be between 0 and 9 (inclusive)');
        }
        if (colors.length == 0 || colors.length > 10 || !colors.every(isStandardColor)) {
            throw TypeError('setColumn must define between 1 and 10 valid colors (inclusive)');
        }
        this.output.send(new SysExMessage(0x0C, [...colors]));
    }

    public setRow(row: number, colors: number[]): void {
        if (row < 0 || row > 9) {
            throw RangeError('Row must be between 0 and 9 (inclusive)');
        }
        if (colors.length == 0 || colors.length > 10 || !colors.every(isStandardColor)) {
            throw TypeError('setRow must define between 1 and 10 valid colors (inclusive)');
        }
        this.output.send(new SysExMessage(0x0D, [...colors]));
    }

    public fill(color: number): void {
        assertIsStandardColor(color);
        this.output.send(new SysExMessage(0x0E, [color]));
    }

    public clear(): void {
        this.stopTextScroll();
        this.fill(0);
    }

    public setGrid(size: GridSize, colors: RGBColor[]): void {
        if (colors.length == 0 || colors.length > (size == GridSize.TEN_BY_TEN ? 100 : 64)) {
            throw TypeError('setGrid must define between 1 and 78 LED colors (inclusive)');
        }
        colors.forEach(color => assertIsRGBColor(color));

        this.output.send(new SysExMessage(0x0F, [size, ...colors.flat()]));
    }

    public flashLEDs(leds: StandardLEDColorDefinition[]): void {
        if (leds.length == 0 || leds.length > 97) {
            throw TypeError('flashLEDs must define between 1 and 97 LED colors (inclusive)');
        }
        this.output.send(new SysExMessage(0x23, [...leds.flatMap(def => def.getSysExRepresentation())]));
    }

    public pulseLEDs(leds: StandardLEDColorDefinition[]): void {
        if (leds.length == 0 || leds.length > 97) {
            throw TypeError('pulseLEDs must define between 1 and 97 LED colors (inclusive)');
        }
        this.output.send(new SysExMessage(0x28, [...leds.flatMap(def => def.getSysExRepresentation())]));
    }

    public scrollText(color: number, loop: boolean, textParts: {speed: number, text: string}[]): void {
        assertIsStandardColor(color);
        const textData = textParts.flatMap(({speed, text}) => {
            if (speed < 1 || speed > 7) {
                throw RangeError('Text speeds must be between 1 and 7 (inclusive)');
            }
            return [speed, ...ascii(text)];
        });
        this.output.send(new SysExMessage(0x14, [color, loop ? 1 : 0, ...textData]));
    }

    public stopTextScroll(): void {
        this.output.send(new SysExMessage(0x14, []));
    }

    public faderSetup(faders: FaderConfig[]): void {
        if (faders.length == 0 || faders.length > 8) {
            throw TypeError('faderSetup must define between 1 and 8 fader configs (inclusive)');
        }

        const faderData = faders.flatMap(fader => {
            if (fader.number < 0 || fader.number > 7) {
                throw RangeError('Fader indices must be between 0 and 7 (inclusive)');
            }
            assertIsStandardColor(fader.color);
            if (fader.initialValue < 0 || fader.initialValue > 127) {
                throw RangeError('Fader initial values must be between 0 and 127 (inclusive)');
            }
            return [fader.number, fader.type, fader.color, fader.initialValue];
        });

        this.output.send(new SysExMessage(0x2B, faderData));
    }
}
