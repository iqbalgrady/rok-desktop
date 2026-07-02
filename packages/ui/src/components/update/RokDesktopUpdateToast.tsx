import * as React from 'react';
import { Icon } from '@/components/icon/Icon';
import { toast } from '@/components/ui/toast';
import { reloadOpenCodeConfiguration } from '@/stores/useAgentsStore';
import { useUIStore } from '@/stores/useUIStore';
import { useI18n } from '@/lib/i18n';
import { runtimeFetch } from '@/lib/runtime-fetch';
import { updateDesktopSettings } from '@/lib/persistence';
import { getDeferredSafeStorage } from '@/stores/utils/safeStorage';
import {
  resolveRokcodeUpdateVersion,
  resolveRokcodeUpgradeStatusVersion,
  shouldShowRokDesktopUpdateToast,
  type RokcodeUpgradeStatusLike,
} from './rokDesktopUpdateDedup';

const UPDATE_TOAST_ID = 'rokcode-update-available';
const UPGRADE_TOAST_ID = 'rokcode-upgrade-progress';
const INITIAL_CHECK_DELAY_MS = 5_000;
const CHECK_RETRY_DELAYS_MS = [10_000, 60_000];
const UPDATE_TOAST_DISMISSED_VERSION_KEY = 'rokcode-update-toast-dismissed-version';

export const RokDesktopUpdateToast: React.FC = () => {
  const { t } = useI18n();
  const showRokcodeUpdateNotifications = useUIStore((state) => state.showRokcodeUpdateNotifications);
  const seenVersionsRef = React.useRef(new Set<string>());
  const upgradingRef = React.useRef(false);

  React.useEffect(() => {
    if (!showRokcodeUpdateNotifications) {
      toast.dismiss(UPDATE_TOAST_ID);
    }
  }, [showRokcodeUpdateNotifications]);

  const reloadOpenCode = React.useCallback(() => {
    toast.dismiss(UPGRADE_TOAST_ID);
    void reloadOpenCodeConfiguration({
      message: t('rokcodeUpdate.toast.reload.message'),
      mode: 'projects',
      scopes: ['all'],
    }).catch(() => undefined);
  }, [t]);

  const runUpgrade = React.useCallback(async () => {
    if (upgradingRef.current) return;
    upgradingRef.current = true;
    toast.dismiss(UPDATE_TOAST_ID);
    toast.message(t('rokcodeUpdate.toast.upgrading.title'), {
      id: UPGRADE_TOAST_ID,
      description: t('rokcodeUpdate.toast.upgrading.description'),
      duration: Infinity,
      icon: <Icon name="refresh" className="h-4 w-4 animate-spin text-muted-foreground" />,
    });

    try {
      const response = await runtimeFetch('/api/opencode/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({}),
      });
      const payload = await response.json().catch(() => null) as null | { success?: boolean; version?: string; error?: string };
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || response.statusText || t('rokcodeUpdate.toast.failed.description'));
      }

      toast.success(t('rokcodeUpdate.toast.updated.title'), {
        id: UPGRADE_TOAST_ID,
        description: payload?.version
          ? t('rokcodeUpdate.toast.updated.descriptionWithVersion', { version: payload.version })
          : t('rokcodeUpdate.toast.updated.description'),
        duration: Infinity,
        icon: <Icon name="check" className="h-4 w-4 text-[var(--status-success)]" />,
        action: {
          label: t('rokcodeUpdate.toast.actions.reload'),
          onClick: reloadOpenCode,
        },
      });
    } catch (error) {
      toast.error(t('rokcodeUpdate.toast.failed.title'), {
        id: UPGRADE_TOAST_ID,
        description: error instanceof Error ? error.message : t('rokcodeUpdate.toast.failed.description'),
        duration: Infinity,
      });
    } finally {
      upgradingRef.current = false;
    }
  }, [reloadOpenCode, t]);

  React.useEffect(() => {
    const showUpdateAvailableToast = (version: string) => {
      // Upstream setting wins over our dedup logic: if user disabled
      // Rokcode update notifications, dismiss any active toast and bail
      // before consulting dedup state.
      if (!useUIStore.getState().showRokcodeUpdateNotifications) {
        toast.dismiss(UPDATE_TOAST_ID);
        return;
      }
      const decision = shouldShowRokDesktopUpdateToast({
        version,
        dismissedVersion: getDeferredSafeStorage().getItem(UPDATE_TOAST_DISMISSED_VERSION_KEY),
        seenVersions: seenVersionsRef.current,
      });
      if (!decision) {
        return;
      }
      seenVersionsRef.current.add(version);

      toast.info(t('rokcodeUpdate.toast.available.title'), {
        id: UPDATE_TOAST_ID,
        description: t('rokcodeUpdate.toast.available.description', { version }),
        duration: Infinity,
        action: {
          label: t('rokcodeUpdate.toast.actions.update'),
          onClick: runUpgrade,
        },
        cancel: {
          label: t('rokcodeUpdate.toast.actions.dismiss'),
          onClick: () => {
            getDeferredSafeStorage().setItem(UPDATE_TOAST_DISMISSED_VERSION_KEY, version);
            void updateDesktopSettings({ openCodeUpdateToastDismissedVersion: version });
            toast.dismiss(UPDATE_TOAST_ID);
          },
        },
      });
    };

    const onUpdateAvailable = (event: Event) => {
      const version = resolveRokcodeUpdateVersion((event as CustomEvent<unknown>).detail);
      showUpdateAvailableToast(version);
    };

    let cancelled = false;
    const timeoutIds: Array<ReturnType<typeof setTimeout>> = [];

    const checkForUpdate = async (attempt: number) => {
      try {
        const response = await runtimeFetch('/api/opencode/upgrade-status', { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(response.statusText || 'Rokcode upgrade status check failed');
        const status = await response.json().catch(() => null) as RokcodeUpgradeStatusLike | null;
        const version = resolveRokcodeUpgradeStatusVersion(status);
        if (!cancelled && version) {
          showUpdateAvailableToast(version);
        }
      } catch {
        const delay = CHECK_RETRY_DELAYS_MS[attempt];
        if (!cancelled && delay !== undefined) {
          timeoutIds.push(setTimeout(() => { void checkForUpdate(attempt + 1); }, delay));
        }
      }
    };

    if (showRokcodeUpdateNotifications) {
      timeoutIds.push(setTimeout(() => { void checkForUpdate(0); }, INITIAL_CHECK_DELAY_MS));
    }

    window.addEventListener('rok-desktop:rokcode-update-available', onUpdateAvailable);
    return () => {
      cancelled = true;
      for (const timeoutId of timeoutIds) clearTimeout(timeoutId);
      window.removeEventListener('rok-desktop:rokcode-update-available', onUpdateAvailable);
    };
  }, [runUpgrade, showRokcodeUpdateNotifications, t]);

  return null;
};
