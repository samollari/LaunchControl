import { renderInteractiveComponentToLaunchpad } from './layout/renderer';
import Launchpad, { LaunchpadLayout } from './launchpad/launchpad';
import Vector from './vector';
import ULXD4QComponent from './components/ulxd/ulxd4q';
import { io } from 'socket.io-client';

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

    const socket = io('ws://localhost:3000');

    renderInteractiveComponentToLaunchpad(
        new ULXD4QComponent('localhost', socket),
        new Vector(1, 1),
        launchpad,
    );
}

main();
