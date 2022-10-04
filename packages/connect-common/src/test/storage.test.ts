import { storage } from '..';

describe('storage', () => {
    beforeEach(() => {
        window.localStorage?.clear();
    });

    test('window.localStorage', () => {
        expect(storage.load()[storage.PERMISSIONS_KEY]).toBe(undefined);
        storage.save((state, setState) => setState({ ...state, [storage.PERMISSIONS_KEY]: [] }));
        expect(storage.load()[storage.PERMISSIONS_KEY]).toStrictEqual([]);

        expect(storage.load()[storage.TRACKING_ENABLED]).toBe(undefined);
        storage.save((state, setState) => setState({ ...state, [storage.TRACKING_ENABLED]: true }));
        expect(storage.load()[storage.TRACKING_ENABLED]).toBe(true);

        expect(storage.load()[storage.TRACKING_ID]).toBe(undefined);
        storage.save((state, setState) =>
            setState({ ...state, [storage.TRACKING_ID]: 'abcd1234' }),
        );
        expect(storage.load()[storage.TRACKING_ID]).toBe('abcd1234');

        // @ts-expect-error
        expect(storage.load('random')).toBe(undefined);
        // @ts-expect-error
        storage.save((state, setState) => setState({ ...state, random: {} }));
        // @ts-expect-error
        expect(storage.load('random')).toStrictEqual({});
    });

    test('memoryStorage', () => {
        expect(storage.load(true)[storage.PERMISSIONS_KEY]).toBe(undefined);
        storage.save(
            (state, setState) => setState({ ...state, [storage.PERMISSIONS_KEY]: [] }),
            true,
        );
        expect(storage.load(true)[storage.PERMISSIONS_KEY]).toStrictEqual([]);
        expect(storage.load()[storage.PERMISSIONS_KEY]).toBe(undefined);

        expect(storage.load(true)[storage.TRACKING_ENABLED]).toBe(undefined);
        storage.save(
            (state, setState) => setState({ ...state, [storage.TRACKING_ENABLED]: true }),
            true,
        );
        expect(storage.load(true)[storage.TRACKING_ENABLED]).toBe(true);
        expect(storage.load()[storage.TRACKING_ENABLED]).toBe(undefined);

        expect(storage.load(true)[storage.TRACKING_ID]).toBe(undefined);
        storage.save(
            (state, setState) => setState({ ...state, [storage.TRACKING_ID]: 'abcd1234' }),
            true,
        );
        expect(storage.load(true)[storage.TRACKING_ID]).toBe('abcd1234');
        expect(storage.load(false)[storage.TRACKING_ID]).toBe(undefined);

        // @ts-expect-error
        expect(storage.load(true).random).toBe(undefined);
        // @ts-expect-error
        storage.save((state, setState) => setState({ ...state, random: {} }), true);
        // @ts-expect-error
        expect(storage.load(true).random).toStrictEqual({});
        // @ts-expect-error
        expect(storage.load().random).toBe(undefined);
    });
});
