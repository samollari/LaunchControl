import { TouchEventType } from '../../launchpad/launchpad';
import { colorScale } from '../../launchpad/ledcolor';
import Component from '../../layout/component';
import { Canvas } from '../../layout/renderer';
import Vector from '../../vector';

export default class ULXDChannelComponent extends Component {
    private connected: boolean = false;
    private rssi: number = -Infinity;
    private audioLevel: number = -Infinity;
    private error: boolean = false;
    private readonly LEVEL_HOLD_THRESH = -6;
    private unacknowledged_high_level: boolean = false;

    public constructor(
        public readonly channelSize: 1 | 2,
        private readonly requestChannelFlash: () => void,
    ) {
        super(new Vector(channelSize, 1));
    }

    public setData(
        diversity: { a: boolean; b: boolean },
        rssi: number,
        audioLevel: number,
    ) {
        this.connected = diversity.a || diversity.b;
        this.rssi = rssi;
        this.audioLevel = audioLevel;
        if (audioLevel > this.LEVEL_HOLD_THRESH) {
            this.unacknowledged_high_level = true;
        }
        this.requestRender([]);
    }

    public hasError(hasError = true): void {
        this.error = hasError;
        this.requestRender([]);
    }

    public render(renderTarget: Canvas): void {
        if (this.error) {
            renderTarget.set(new Vector(0, 0), 5);
            if (this.channelSize == 2) {
                renderTarget.set(new Vector(1, 0), 5);
            }
            this.hasError(false);
        } else {
            switch (this.channelSize) {
                case 1: {
                    // If not connected, show purple
                    // If connected:
                    // With low audio level, show a dim blue
                    // With medium audio level, show a bright blue
                    // With a high audio level, show orange

                    renderTarget.set(
                        new Vector(0, 0),
                        this.connected
                            ? this.unacknowledged_high_level
                                ? 9
                                : colorScale(
                                      {
                                          '-40': 35,
                                          '-20': 32,
                                          '-12': 10,
                                          '-6': 9,
                                      },
                                      this.audioLevel,
                                  )
                            : 48,
                    );

                    break;
                }

                case 2: {
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
                            ? this.unacknowledged_high_level
                                ? 9
                                : colorScale(
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
                    break;
                }
            }
        }
    }

    public touched(eventType: TouchEventType, position: Vector): void {
        console.log({ eventType, position });
        if (eventType === 'touchDown') {
            if (
                position.x == this.channelSize - 1 &&
                this.unacknowledged_high_level
            ) {
                this.unacknowledged_high_level = false;
                this.requestRender([]);
            }
        }
    }
}
