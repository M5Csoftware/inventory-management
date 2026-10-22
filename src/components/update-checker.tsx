'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, DownloadCloud, CheckCircle2, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

export function UpdateChecker() {
  const [isTauri, setIsTauri] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  useEffect(() => {
    // Check if running inside Tauri environment
    const inTauri = typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
    setIsTauri(inTauri);

    if (inTauri) {
      checkForUpdates(true);
    }
  }, []);

  const checkForUpdates = useCallback(async (silent = false) => {
    try {
      setIsChecking(true);
      // Dynamically import Tauri updater so browser environments don't error out
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();

      if (update?.available) {
        setUpdateInfo(update);
        toast.info(`🎉 Software update v${update.version} is available!`, {
          autoClose: 5000,
        });
      } else {
        setUpdateInfo(null);
        if (!silent) {
          toast.success('Your software is up to date.');
        }
      }
    } catch (error) {
      if (!silent) {
        console.error('Update check failed:', error);
        toast.error('Could not check for updates.');
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  const handleInstallUpdate = async () => {
    if (!updateInfo) return;

    try {
      setIsInstalling(true);
      toast.info('Downloading update package...');

      let downloaded = 0;
      let contentLength = 0;

      await updateInfo.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setDownloadProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            setDownloadProgress(100);
            break;
        }
      });

      toast.success('Update installed! Restarting application...');
      
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (error: any) {
      console.error('Failed to install update:', error);
      toast.error(error?.message || 'Failed to install update.');
      setIsInstalling(false);
    }
  };

  if (!isTauri) {
    return null;
  }

  if (updateInfo) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
        <Button
          size="sm"
          onClick={handleInstallUpdate}
          disabled={isInstalling}
          className="h-8 gap-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm font-semibold text-xs rounded-lg"
          title={`Update to version ${updateInfo.version}`}
        >
          {isInstalling ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>{downloadProgress !== null ? `${downloadProgress}%` : 'Installing...'}</span>
            </>
          ) : (
            <>
              <ArrowUpCircle className="h-3.5 w-3.5 text-white" />
              <span>Update to v{updateInfo.version}</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => checkForUpdates(false)}
      disabled={isChecking}
      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      title="Check for software updates"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin text-primary' : ''}`} />
    </Button>
  );
}
