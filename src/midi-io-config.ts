export enum MIDIRequestType {
    INPUT = 1,
    OUTPUT = 2,
    INPUT_OUTPUT = 3,
}

type KeyReqTypeMap = { [key: string]: MIDIRequestType };

export type MIDIRequests<N extends KeyReqTypeMap> = {
    [key in keyof N]: {
        requestName: string;
        requestType: N[key];
    };
};

type MIDIRequest<
    R extends MIDIRequests<KeyReqTypeMap> = MIDIRequests<KeyReqTypeMap>,
> = R[keyof R];

type RequestsInput<R extends MIDIRequests<KeyReqTypeMap>> = R[keyof R] & {
    requestType: MIDIRequestType.INPUT | MIDIRequestType.INPUT_OUTPUT;
};

function requestsInput<R extends MIDIRequests<KeyReqTypeMap>>(
    request: MIDIRequest<R>,
): request is RequestsInput<R> {
    return !!(request.requestType & 0x1);
}

type RequestsOutput<R extends MIDIRequests<KeyReqTypeMap>> = R[keyof R] & {
    requestType: MIDIRequestType.OUTPUT | MIDIRequestType.INPUT_OUTPUT;
};

function requestsOutput<R extends MIDIRequests<KeyReqTypeMap>>(
    request: MIDIRequest<R>,
): request is RequestsOutput<R> {
    return !!(request.requestType & 0x2);
}

type Input = { input: MIDIInput };
type Output = { output: MIDIOutput };
type InputOutput = Input & Output;

export type MIDIDevices<N extends KeyReqTypeMap> = {
    [key in keyof N]: N[key] extends MIDIRequestType.INPUT
        ? Input
        : N[key] extends MIDIRequestType.OUTPUT
          ? Output
          : N[key] extends MIDIRequestType.INPUT_OUTPUT
            ? InputOutput
            : never;
};

type IO = 'input' | 'output';

type FilteredRequests<T extends IO, N extends KeyReqTypeMap> = {
    [key in keyof N]: N[key] extends MIDIRequestType.INPUT_OUTPUT
        ? N[key]
        : N[key] extends MIDIRequestType.INPUT
          ? T extends 'input'
              ? N[key]
              : never
          : N[key] extends MIDIRequestType.OUTPUT
            ? T extends 'output'
                ? N[key]
                : never
            : never;
};

function pluralizeIO(type: IO): `${typeof type}s` {
    return type === 'input' ? 'inputs' : 'outputs';
}

function buildDeviceMatrix<N extends KeyReqTypeMap>(
    requests: MIDIRequests<N>,
    access: MIDIAccess,
    type: IO,
): HTMLFieldSetElement {
    const requestsOfType = Object.fromEntries(
        Object.entries(requests).filter(([_, request]) => {
            if (type === 'input') {
                return requestsInput(request);
            } else if (type === 'output') {
                return requestsOutput(request);
            }
        }),
    ) as FilteredRequests<typeof type, N>;

    const typeKey = pluralizeIO(type);
    const devicesOfType = [...access[typeKey].values()] as
        | MIDIInput[]
        | MIDIOutput[];

    const container = document.createElement('fieldset');
    const label = document.createElement('label');
    label.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    container.appendChild(label);

    const table = document.createElement('table');
    const header = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th'));
    for (const request of Object.values(
        requestsOfType,
    ) as (typeof requests)[keyof N][]) {
        const header = document.createElement('th');
        header.textContent = request.requestName;
        headerRow.appendChild(header);
    }
    header.appendChild(headerRow);
    table.appendChild(header);
    const body = document.createElement('tbody');

    for (const device of devicesOfType) {
        const row = document.createElement('tr');
        const deviceName = document.createElement('td');
        deviceName.textContent = device.name;
        row.appendChild(deviceName);

        for (const request of Object.keys(requestsOfType)) {
            const cell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'radio';
            checkbox.name = `${request}-${type}`;
            checkbox.value = device.id;
            checkbox.checked = false;
            checkbox.dataset.request = request;
            checkbox.dataset.device = device.id;
            checkbox.dataset.type = type;
            cell.appendChild(checkbox);
            row.appendChild(cell);
        }
        body.appendChild(row);
    }
    table.appendChild(body);
    container.appendChild(table);

    return container;
}

type K<O extends object> = Extract<keyof O, string>;

function getDeviceForRequestIfHasType<
    N extends KeyReqTypeMap,
    R extends MIDIRequests<N>,
    I extends K<R>,
    T extends IO,
>(formData: FormData, reqId: I, requests: R, type: T, access: MIDIAccess) {
    const request = requests[reqId];
    if (
        (type === 'input' && !requestsInput(request)) ||
        (type === 'output' && !requestsOutput(request))
    ) {
        return undefined;
        // throw new Error(
        //     `Request ${reqId} of type ${MIDIRequestType[request.requestType]} is not an ${type}`,
        // );
    }

    const deviceId = formData.get(`${reqId}-${type}`) as string | null;

    return (
        !deviceId ? undefined : access[pluralizeIO(type)].get(deviceId)!
    ) as T extends 'input'
        ? R[I] extends RequestsInput<R>
            ? MIDIInput | undefined
            : never
        : T extends 'output'
          ? R[I] extends RequestsOutput<R>
              ? MIDIOutput | undefined
              : never
          : never;
}

async function hookFormSubmit<N extends KeyReqTypeMap>(
    form: HTMLFormElement,
    requests: MIDIRequests<N>,
    access: MIDIAccess,
): Promise<MIDIDevices<N>> {
    const formData = await new Promise<FormData>((resolve) => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            resolve(new FormData(form));
        });
    });

    return Object.fromEntries(
        (Object.keys(requests) as K<N>[]).map((reqId) => {
            const request = requests[reqId];
            const requestShouldHaveInput = requestsInput(request);
            const requestShouldHaveOutput = requestsOutput(request);

            if (!requestShouldHaveInput && !requestShouldHaveOutput) {
                throw new Error(
                    `Request ${reqId} of type ${MIDIRequestType[request.requestType]} is not an input or output`,
                );
            }

            const input = getDeviceForRequestIfHasType(
                formData,
                reqId,
                requests,
                'input',
                access,
            );

            const output = getDeviceForRequestIfHasType(
                formData,
                reqId,
                requests,
                'output',
                access,
            );

            if (
                (!input && requestShouldHaveInput) ||
                (!output && requestShouldHaveOutput)
            ) {
                throw new Error(
                    `No device selected for request ${reqId} of type ${MIDIRequestType[request.requestType]}`,
                );
            }

            return [reqId, { input, output } as MIDIDevices<N>[keyof N]];
        }),
    ) as MIDIDevices<N>;
}

export default async function getMIDIDevices<N extends KeyReqTypeMap>(
    requests: MIDIRequests<N>,
    mountElement: HTMLElement,
): Promise<MIDIDevices<N>> {
    // const permissions = await navigator.permissions.query({
    //     name: 'midi',
    //     // @ts-expect-error Doesn't include midi types
    //     sysex: true,
    // });

    const access = await navigator.requestMIDIAccess({
        sysex: true,
    });

    const form = document.createElement('form');

    const inputContainer = buildDeviceMatrix(requests, access, 'input');
    const outputContainer = buildDeviceMatrix(requests, access, 'output');
    form.appendChild(inputContainer);
    form.appendChild(outputContainer);
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Submit';
    form.appendChild(submitButton);
    mountElement.appendChild(form);

    return await hookFormSubmit(form, requests, access)
        .catch((e) => {
            console.error(e);
            const errorText = document.createElement('pre');
            errorText.textContent = String(e);
            errorText.style.color = 'red';
            mountElement.appendChild(errorText);
            return Promise.reject(e);
        })
        .finally(() => {
            form.querySelectorAll('input').forEach((input) => {
                input.disabled = true;
            });
            form.querySelector('button[type="submit"]')?.remove();
            const reconfigureButton = document.createElement('button');
            reconfigureButton.textContent = 'Reconfigure';
            reconfigureButton.onclick = (event) => {
                event.preventDefault();
                location.reload();
            };
            mountElement.appendChild(reconfigureButton);
        });
}
