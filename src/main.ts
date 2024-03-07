import { GridLayoutComponent } from './layout/layouts';
import { Canvas, renderComponentToLaunchpad } from './layout/renderer';
// import PalleteTestComponent from './components/test/pallete';
// import RandomColorComponent from './components/test/randomcolor';
// import { VerticalLayoutComponent } from './layout/layouts';
import Launchpad, { LaunchpadLayout } from './launchpad/launchpad';
import { GridIndexTranslator, range } from './util';
import Vector from './vector';
import BubbleWrapComponent from './components/test/bubblewrap';
import { MIDIMessageType } from './launchpad/midimessages';

let launchpad: Launchpad;

async function main() {
    const midiPermissions = await navigator.permissions.query({
        // @ts-expect-error Doesn't include midi types
        name: 'midi',
        sysex: true,
    });

    function updatePermissionsState(state: string) {
        const permissionsElement =
            document.querySelector<HTMLSpanElement>('#midiPermission');
        if (!permissionsElement) {
            throw ReferenceError('Could not find permissions state element');
        }
        permissionsElement.textContent = state;
    }
    midiPermissions.addEventListener('change', function () {
        updatePermissionsState(this.state);
    });
    updatePermissionsState(midiPermissions.state);

    function updateMidiAccessState(state: string) {
        const accessElement =
            document.querySelector<HTMLSpanElement>('#midiAccess');
        if (!accessElement) {
            throw ReferenceError('Could not find access state element');
        }
        accessElement.textContent = state;
    }

    try {
        updateMidiAccessState('requesting');
        const midiAccess = await navigator.requestMIDIAccess({
            software: false,
            sysex: true,
        });
        updateMidiAccessState('ready');

        withMidiAccess(midiAccess);
    } catch (e) {
        updateMidiAccessState(`error: ${e}`);
    }
}

async function withMidiAccess(access: MIDIAccess) {
    const sysexElement =
        document.querySelector<HTMLSpanElement>('#sysexAllowed');
    if (!sysexElement) {
        throw ReferenceError('Could not find access state element');
    }
    sysexElement.textContent = access.sysexEnabled ? 'yes' : 'no';

    console.log({ inputs: access.inputs, outputs: access.outputs });

    const inputDevice = ([...access.inputs].find(
        ([_, input]) => input.name?.includes('MIDIIN2') ?? false,
    ) ?? [])[1];
    const outputDevice = ([...access.outputs].find(
        ([_, output]) => output.name?.includes('MIDIOUT2') ?? false,
    ) ?? [])[1];

    const inputElement =
        document.querySelector<HTMLSpanElement>('#inputDevice');
    const outputElement =
        document.querySelector<HTMLSpanElement>('#outputDevice');
    if (!inputElement || !outputElement) {
        throw ReferenceError('Could not find i/o state element(s)');
    }
    inputElement.textContent = inputDevice?.name ?? 'unavailable';
    outputElement.textContent = outputDevice?.name ?? 'unavailable';

    if (!inputDevice || !outputDevice) {
        throw ReferenceError('Could not find a suitable i/o device');
    }

    launchpad = new Launchpad(inputDevice, outputDevice);
    await launchpad.init();
    launchpad.clear();
    launchpad.layout = LaunchpadLayout.PROGRAMMER;
    // launchpad.scrollText(0x7C, true, [
    //     {
    //         speed: 5,
    //         text: 'Hello '
    //     },
    //     {
    //         speed: 2,
    //         text: 'world!'
    //     }
    // ]);
    // launchpad.pulseLEDs([new StandardLEDColorDefinition(99, 48)]);
    // launchpad.flashLEDs([new StandardLEDColorDefinition(0x0A, 72)]);

    // const component = new TestComponent(new Vector(8, 1));

    // const components = [];
    // for (const _ of range(8)) {
    //     components.push(new RandomColorComponent(new Vector(8, 1)));
    // }
    // const component = new VerticalLayoutComponent(components);
    // setInterval(() => {
    //     renderComponentToLaunchpad(component, new Vector(1, 1), launchpad);
    // }, 1000);

    const components = [];
    for (const _ of range(100)) {
        components.push(new BubbleWrapComponent());
    }
    const gridComponent = new GridLayoutComponent(
        components,
        new Vector(10, 10),
    );

    const canvas = Canvas.renderComponent(gridComponent);
    renderComponentToLaunchpad(canvas, new Vector(0, 0), launchpad);
    const padIndexTranslator = new GridIndexTranslator(new Vector(10, 10));
    launchpad.input.addEventListener('midimessage', (e) => {
        const { data } = e as MIDIMessageEvent;
        const [msgType, pad, vel] = data;
        if (
            !(
                msgType == MIDIMessageType.NOTE ||
                msgType == MIDIMessageType.SYSEX
            )
        ) {
            return;
        }

        const touchPosition = padIndexTranslator
            .getPosition(pad)
            .elwiseMult(new Vector(1, -1))
            .add(new Vector(0, 9));
        const eventType = vel > 0 ? 'touchDown' : 'touchUp';

        gridComponent.registerTouchEvent(eventType, touchPosition);
    });
    gridComponent.requestRender = (componentTrace) => {
        const canvas = Canvas.renderComponent(
            gridComponent,
            componentTrace.slice(1),
        );
        renderComponentToLaunchpad(canvas, new Vector(0, 0), launchpad);
    };
}

main();
