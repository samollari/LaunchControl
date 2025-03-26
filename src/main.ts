import { renderInteractiveComponentToLaunchpad } from './layout/renderer';
import Launchpad, { LaunchpadLayout } from './launchpad/launchpad';
import Vector from './vector';
import ULXD4QComponent from './components/ulxd/ulxd4q';
import { io } from 'socket.io-client';
import {
    HorizontalLayoutComponent,
    VerticalLayoutComponent,
} from './layout/layouts';
import getMIDIDevices, { MIDIRequestType } from './midi-io-config';

let launchpad: Launchpad;

async function main() {
    const devices = await getMIDIDevices(
        {
            launchpad: {
                requestName: 'Launchpad',
                requestType: MIDIRequestType.INPUT_OUTPUT,
            },
        },
        document.querySelector('#app')!,
    );

    launchpad = new Launchpad(
        devices.launchpad.input,
        devices.launchpad.output,
    );
    await launchpad.init();
    launchpad.clear();
    launchpad.layout = LaunchpadLayout.PROGRAMMER;

    const socket = io('ws://localhost:3000');

    renderInteractiveComponentToLaunchpad(
        new ULXD4QComponent('localhost', socket, 1),
        new Vector(1, 1),
        launchpad,
    );
}

main();
