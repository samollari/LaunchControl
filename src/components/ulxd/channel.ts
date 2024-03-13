import { colorScale } from '../../launchpad/ledcolor';
import Component from '../../layout/component';
import { Canvas } from '../../layout/renderer';
import Vector from '../../vector';

export default class ULXDChannelComponent extends Component {
    private connected: boolean = false;
    private rssi: number = -Infinity;
    private audioLevel: number = -Infinity;
    private error: boolean = false;

    public constructor() {
        super(new Vector(2, 1));
    }

    public setData(
        diversity: { a: boolean; b: boolean },
        rssi: number,
        audioLevel: number,
    ) {
        this.connected = diversity.a || diversity.b;
        this.rssi = rssi;
        this.audioLevel = audioLevel;
        this.requestRender([]);
    }

    public hasError(hasError = true): void {
        this.error = hasError;
        this.requestRender([]);
    }

    public render(renderTarget: Canvas): void {
        if (this.error) {
            renderTarget.set(new Vector(0, 0), 5);
            renderTarget.set(new Vector(1, 0), 5);
            this.hasError(false);
        } else {
            renderTarget.set(
                new Vector(0, 0),
                this.connected
                    ? colorScale(
                          {
                              '-90': 39,
                              '-83': 38,
                              '-77': 37,
                              '-70': 36,
                              '-25': 5,
                          },
                          this.rssi,
                      )
                    : 0,
            );

            renderTarget.set(
                new Vector(1, 0),
                this.connected
                    ? colorScale(
                          {
                              '-40': 19,
                              '-30': 18,
                              '-20': 17,
                              '-12': 14,
                              '-6': 9,
                              '0': 5,
                          },
                          this.audioLevel,
                      )
                    : 0,
            );
        }
    }
}
