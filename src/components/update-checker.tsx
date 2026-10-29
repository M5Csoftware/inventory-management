"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";
import { RefreshCw, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import type { Update } from "@tauri-apps/plugin-updater";

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // re-check every 30 minutes
const INITIAL_DELAY_MS = 3000; // let the app finish loading first

const subscribeToTauriEnvironment = () => () => {};
const getTauriSnapshot = () =>
  typeof window !== "undefined" &&
  ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
const getServerTauriSnapshot = () => false;

export function UpdateChecker() {
  const isTauri = useSyncExternalStore(
    subscribeToTauriEnvironment,
    getTauriSnapshot,
    getServerTauriSnapshot,
  );
  const [updateInfo, setUpdateInfo] = useState<Update | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  // Remember which version we already announced so the toast doesn't repeat every check
  const announcedVersion = useRef<string | null>(null);
  const installingRef = useRef(false);

  const checkForUpdates = useCallback(async (silent = false) => {
    // Don't swap out the update object while one is downloading
    if (installingRef.current) return;

    try {
      setIsChecking(true);
      // Dynamic import so plain-browser builds don't break
      const { check } = await import("@tauri-apps/plugin-updater");

      // Tauri v2: check() resolves to an Update object, or null when up to date.
      // (There is no `.available` property in v2.)
      const update = await check();

      if (update) {
        setUpdateInfo(update);
        if (announcedVersion.current !== update.version) {
          announcedVersion.current = update.version;
          toast.info(`🎉 Software update v${update.version} is available!`, {
            autoClose: 5000,
          });
        }
      } else {
        setUpdateInfo(null);
        if (!silent) {
          toast.success("Your software is up to date.");
        }
      }
    } catch (error: unknown) {
      // Always log, even for silent checks, otherwise config problems are invisible
      console.error("[updater] check failed:", error);
      if (!silent) {
        const message = error instanceof Error ? error.message : String(error);
        toast.error(`Could not check for updates: ${message}`);
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!isTauri) return;

    const initial = setTimeout(() => checkForUpdates(true), INITIAL_DELAY_MS);
    const interval = setInterval(
      () => checkForUpdates(true),
      CHECK_INTERVAL_MS,
    );

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [checkForUpdates, isTauri]);

  const handleInstallUpdate = async () => {
    if (!updateInfo || installingRef.current) return;

    try {
      installingRef.current = true;
      setIsInstalling(true);
      setDownloadProgress(0);
      toast.info("Downloading update package...");

      let downloaded = 0;
      let contentLength = 0;

      await updateInfo.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setDownloadProgress(
                Math.min(100, Math.round((downloaded / contentLength) * 100)),
              );
            }
            break;
          case "Finished":
            setDownloadProgress(100);
            break;
        }
      });

      toast.success("Update installed! Restarting application...");

      // On Windows the installer may close the app on its own; relaunch covers the other cases
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (error: unknown) {
      console.error("[updater] install failed:", error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || "Failed to install update.");
      installingRef.current = false;
      setIsInstalling(false);
      setDownloadProgress(null);
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
              <span>
                {downloadProgress !== null && downloadProgress > 0
                  ? `${downloadProgress}%`
                  : "Installing..."}
              </span>
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
      <RefreshCw
        className={`h-3.5 w-3.5 ${isChecking ? "animate-spin text-primary" : ""}`}
      />
    </Button>
  );
}
