import { Transport } from '../../src';

type Fixture<Method extends (...args: any) => any> = {
    description: string;
    in: Parameters<Method>;
    out: Awaited<ReturnType<Method>>;
};

const enumerate: Fixture<Transport['enumerate']>[] = [
    {
        description: 'my connected device',
        in: [],
        out: [{ path: '0A798C90E3EBD2ACE9739607' }],
    },
];

export const fixtures = {
    enumerate,
};
