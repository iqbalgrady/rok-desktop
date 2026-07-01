import { describe, test, expect } from 'bun:test';

import {
    resolveRokcodeUpdateVersion,
    resolveRokcodeUpgradeStatusVersion,
    shouldShowRokDesktopUpdateToast,
    shouldShowPwaInstallToast,
} from '../rokDesktopUpdateDedup';

describe('shouldShowPwaInstallToast', () => {
    test('returns true when nothing blocks the toast', () => {
        expect(
            shouldShowPwaInstallToast({
                dismissed: null,
                sessionShown: null,
                hasActiveToast: false,
            }),
        ).toBe(true);
    });

    test('returns false when persistent dismissal is set', () => {
        expect(
            shouldShowPwaInstallToast({
                dismissed: 'true',
                sessionShown: null,
                hasActiveToast: false,
            }),
        ).toBe(false);
    });

    test('returns false when the toast was already shown in this session', () => {
        expect(
            shouldShowPwaInstallToast({
                dismissed: null,
                sessionShown: 'true',
                hasActiveToast: false,
            }),
        ).toBe(false);
    });

    test('returns false when the effect already owns an active toast', () => {
        expect(
            shouldShowPwaInstallToast({
                dismissed: null,
                sessionShown: null,
                hasActiveToast: true,
            }),
        ).toBe(false);
    });

    test('treats non-"true" storage values as unset', () => {
        expect(
            shouldShowPwaInstallToast({
                dismissed: 'false',
                sessionShown: '0',
                hasActiveToast: false,
            }),
        ).toBe(true);
    });

    test('persistent dismissal wins even when session marker is also set', () => {
        expect(
            shouldShowPwaInstallToast({
                dismissed: 'true',
                sessionShown: 'true',
                hasActiveToast: false,
            }),
        ).toBe(false);
    });
});

describe('shouldShowRokDesktopUpdateToast', () => {
    test('returns true for a fresh version with no dismissal and an empty seen set', () => {
        expect(
            shouldShowRokDesktopUpdateToast({
                version: '1.16.0',
                dismissedVersion: null,
                seenVersions: new Set(),
            }),
        ).toBe(true);
    });

    test('returns false for an empty version string', () => {
        expect(
            shouldShowRokDesktopUpdateToast({
                version: '',
                dismissedVersion: null,
                seenVersions: new Set(),
            }),
        ).toBe(false);
    });

    test('returns false when the version was already surfaced in this session', () => {
        expect(
            shouldShowRokDesktopUpdateToast({
                version: '1.16.0',
                dismissedVersion: null,
                seenVersions: new Set(['1.16.0']),
            }),
        ).toBe(false);
    });

    test('returns false when the dismissed version matches the incoming version', () => {
        expect(
            shouldShowRokDesktopUpdateToast({
                version: '1.16.0',
                dismissedVersion: '1.16.0',
                seenVersions: new Set(),
            }),
        ).toBe(false);
    });

    test('returns true when a different version was previously dismissed', () => {
        expect(
            shouldShowRokDesktopUpdateToast({
                version: '1.17.0',
                dismissedVersion: '1.16.0',
                seenVersions: new Set(),
            }),
        ).toBe(true);
    });

    test('treats null dismissedVersion as no prior dismissal', () => {
        expect(
            shouldShowRokDesktopUpdateToast({
                version: '1.16.0',
                dismissedVersion: null,
                seenVersions: new Set(['1.15.0']),
            }),
        ).toBe(true);
    });

    test('seen set blocks even when dismissed version differs', () => {
        expect(
            shouldShowRokDesktopUpdateToast({
                version: '1.16.0',
                dismissedVersion: '1.15.0',
                seenVersions: new Set(['1.16.0']),
            }),
        ).toBe(false);
    });
});

describe('resolveRokcodeUpdateVersion', () => {
    test('returns the trimmed version when detail.version is a string', () => {
        expect(resolveRokcodeUpdateVersion({ version: '1.16.0' })).toBe('1.16.0');
    });

    test('trims surrounding whitespace from a string version', () => {
        expect(resolveRokcodeUpdateVersion({ version: '  1.16.0  ' })).toBe('1.16.0');
    });

    test('returns empty string when detail is null', () => {
        expect(resolveRokcodeUpdateVersion(null)).toBe('');
    });

    test('returns empty string when detail is undefined', () => {
        expect(resolveRokcodeUpdateVersion(undefined)).toBe('');
    });

    test('returns empty string when detail is not an object', () => {
        expect(resolveRokcodeUpdateVersion('1.16.0')).toBe('');
        expect(resolveRokcodeUpdateVersion(42)).toBe('');
        expect(resolveRokcodeUpdateVersion(true)).toBe('');
    });

    test('returns empty string when the version field is missing', () => {
        expect(resolveRokcodeUpdateVersion({})).toBe('');
    });

    test('returns empty string when the version field is non-string', () => {
        expect(resolveRokcodeUpdateVersion({ version: 116 })).toBe('');
        expect(resolveRokcodeUpdateVersion({ version: null })).toBe('');
        expect(resolveRokcodeUpdateVersion({ version: { major: 1 } })).toBe('');
    });
});

describe('resolveRokcodeUpgradeStatusVersion', () => {
    test('returns the trimmed latestVersion when available is true', () => {
        expect(
            resolveRokcodeUpgradeStatusVersion({
                available: true,
                latestVersion: '1.16.0',
            }),
        ).toBe('1.16.0');
    });

    test('trims surrounding whitespace from latestVersion', () => {
        expect(
            resolveRokcodeUpgradeStatusVersion({
                available: true,
                latestVersion: '  1.16.0  ',
            }),
        ).toBe('1.16.0');
    });

    test('returns empty string when status is null', () => {
        expect(resolveRokcodeUpgradeStatusVersion(null)).toBe('');
    });

    test('returns empty string when status is undefined', () => {
        expect(resolveRokcodeUpgradeStatusVersion(undefined)).toBe('');
    });

    test('returns empty string when available is false', () => {
        expect(
            resolveRokcodeUpgradeStatusVersion({
                available: false,
                latestVersion: '1.16.0',
            }),
        ).toBe('');
    });

    test('returns empty string when available is missing or null', () => {
        expect(
            resolveRokcodeUpgradeStatusVersion({
                latestVersion: '1.16.0',
            }),
        ).toBe('');
        expect(
            resolveRokcodeUpgradeStatusVersion({
                available: null,
                latestVersion: '1.16.0',
            }),
        ).toBe('');
    });

    test('returns empty string when latestVersion is missing', () => {
        expect(resolveRokcodeUpgradeStatusVersion({ available: true })).toBe('');
    });

    test('returns empty string when latestVersion is non-string', () => {
        expect(
            resolveRokcodeUpgradeStatusVersion({
                available: true,
                latestVersion: null,
            }),
        ).toBe('');
    });
});
