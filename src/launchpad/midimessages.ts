export abstract class MIDIMessage implements Iterable<number> {
    abstract [Symbol.iterator](): Iterator<number>;
}

export class SysExMessage extends MIDIMessage {
    private static readonly header = new Uint8Array([0xF0, 0x00, 0x20, 0x29, 0x02, 0x10]);
    private static readonly trailer = new Uint8Array([0xF7]);
    public readonly messageType: number;
    public message: Uint8Array;

    public constructor(messageType: number, message: Iterable<number>) {
        super();
        this.messageType = messageType;
        this.message = new Uint8Array(message);
    }

    [Symbol.iterator](): Iterator<number> {
        return [...SysExMessage.header, this.messageType, ...this.message, ...SysExMessage.trailer][Symbol.iterator]();
    }
}

export interface SysExComponent {
    getSysExRepresentation(): Iterable<number>;
}
