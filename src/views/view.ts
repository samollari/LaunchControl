import { LaunchpadModel } from "../launchpad";

export default class View {
    protected readonly launchpad: LaunchpadModel;

    public constructor(launchpad: LaunchpadModel) {
        this.launchpad = launchpad;
    }
}
