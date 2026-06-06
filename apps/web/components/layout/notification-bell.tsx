"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Archive, Bell, CheckCheck, Clock, Inbox, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  archivedAt?: string | null;
  createdAt: string;
};

type NotificationTab = "inbox" | "archive";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatFullTime(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "full", timeStyle: "medium" }).format(new Date(value));
}

function notifyBrowser(notification: Notification) {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(notification.title, { body: notification.message });
}

export function NotificationBell() {
  const token = useAuthStore((state) => state.token);
  const pushToast = useToast((state) => state.push);
  const [inboxNotifications, setInboxNotifications] = useState<Notification[]>([]);
  const [archivedNotifications, setArchivedNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationTab>("inbox");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);
  const unreadCount = useMemo(() => inboxNotifications.filter((notification) => !notification.isRead).length, [inboxNotifications]);
  const displayedNotifications = activeTab === "archive" ? archivedNotifications : inboxNotifications;

  useEffect(() => {
    setMounted(true);
  }, []);

  async function loadNotifications() {
    if (!token) return;
    const [inboxData, archiveData] = await Promise.all([
      apiFetch<{ notifications: Notification[] }>("/notifications", { token }),
      apiFetch<{ notifications: Notification[] }>("/notifications?archived=true", { token })
    ]);

    const newUnread = inboxData.notifications.filter((notification) => !notification.isRead && !seenIdsRef.current.has(notification.id));
    const allIds = [...inboxData.notifications, ...archiveData.notifications].map((notification) => notification.id);
    seenIdsRef.current = new Set(allIds);
    setInboxNotifications(inboxData.notifications);
    setArchivedNotifications(archiveData.notifications);

    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      return;
    }

    if (newUnread[0]) {
      pushToast({ title: newUnread[0].title, message: newUnread[0].message, tone: "info" });
      notifyBrowser(newUnread[0]);
    }
  }

  useEffect(() => {
    loadNotifications().catch(() => undefined);
    const timer = window.setInterval(() => loadNotifications().catch(() => undefined), 12_000);
    return () => window.clearInterval(timer);
  }, [token]);

  async function requestPushPermission() {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission().catch(() => undefined);
    }
  }

  function updateNotification(id: string, update: Partial<Notification>) {
    setInboxNotifications((current) => current.map((notification) => (notification.id === id ? { ...notification, ...update } : notification)));
    setArchivedNotifications((current) => current.map((notification) => (notification.id === id ? { ...notification, ...update } : notification)));
    setSelectedNotification((current) => (current?.id === id ? { ...current, ...update } : current));
  }

  async function markRead(id: string) {
    if (!token) return;
    await apiFetch(`/notifications/${id}/read`, { method: "PUT", token });
    updateNotification(id, { isRead: true });
  }

  async function openDetail(notification: Notification) {
    setSelectedNotification({ ...notification, isRead: true });
    if (!notification.isRead) await markRead(notification.id);
  }

  async function markAllRead() {
    if (!token) return;
    await apiFetch("/notifications/mark-all-read", { method: "PUT", token });
    setInboxNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
  }

  async function archiveNotification(notification: Notification) {
    if (!token) return;
    await apiFetch(`/notifications/${notification.id}/archive`, { method: "PUT", token });
    const archived = { ...notification, isRead: true, archivedAt: new Date().toISOString() };
    setInboxNotifications((current) => current.filter((item) => item.id !== notification.id));
    setArchivedNotifications((current) => [archived, ...current.filter((item) => item.id !== notification.id)]);
    setSelectedNotification((current) => (current?.id === notification.id ? archived : current));
  }

  async function restoreNotification(notification: Notification) {
    if (!token) return;
    await apiFetch(`/notifications/${notification.id}/unarchive`, { method: "PUT", token });
    const restored = { ...notification, archivedAt: null };
    setArchivedNotifications((current) => current.filter((item) => item.id !== notification.id));
    setInboxNotifications((current) => [restored, ...current.filter((item) => item.id !== notification.id)]);
    setSelectedNotification((current) => (current?.id === notification.id ? restored : current));
  }

  return (
    <>
      <div className="group/notifications relative">
        <button
          type="button"
          onClick={() => {
            requestPushPermission().catch(() => undefined);
            loadNotifications().catch(() => undefined);
            if (typeof window !== "undefined" && window.innerWidth < 1024) setMobilePanelOpen(true);
          }}
          className="relative grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15 dark:hover:text-white sm:h-10 sm:w-10"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5 sm:h-4 sm:w-4" />
          {unreadCount ? (
            <span className="absolute right-1.5 top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-loss px-1 text-[10px] font-black leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>

        <div className="invisible pointer-events-none fixed left-3 right-3 top-[4.65rem] z-[90] hidden max-w-[calc(100vw-1.5rem)] origin-top translate-y-3 scale-95 opacity-0 transition duration-200 ease-out group-hover/notifications:visible group-hover/notifications:pointer-events-auto group-hover/notifications:translate-y-0 group-hover/notifications:scale-100 group-hover/notifications:opacity-100 group-focus-within/notifications:visible group-focus-within/notifications:pointer-events-auto group-focus-within/notifications:translate-y-0 group-focus-within/notifications:scale-100 group-focus-within/notifications:opacity-100 lg:absolute lg:left-auto lg:right-0 lg:top-full lg:block lg:w-[min(390px,calc(100vw-32px))] lg:pt-3">
          <div className="max-h-[calc(100dvh-6rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#07152d] lg:max-h-none lg:rounded-lg">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 p-3 dark:border-white/10">
              <div>
                <div className="font-semibold">Notifications</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</div>
              </div>
              <Button type="button" variant="ghost" className="h-9 shrink-0 rounded-md px-2" onClick={markAllRead} disabled={!inboxNotifications.length}>
                <CheckCheck className="h-4 w-4" />
                <span className="hidden min-[360px]:inline">Read all</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 border-b border-slate-200 p-2 dark:border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("inbox")}
                className={cn("inline-flex h-9 items-center justify-center gap-2 rounded-md text-sm font-semibold transition", activeTab === "inbox" ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10")}
              >
                <Inbox className="h-4 w-4" />
                Inbox
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("archive")}
                className={cn("inline-flex h-9 items-center justify-center gap-2 rounded-md text-sm font-semibold transition", activeTab === "archive" ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10")}
              >
                <Archive className="h-4 w-4" />
                Archive
              </button>
            </div>

            <div className="max-h-[calc(100dvh-17rem)] overflow-y-auto overscroll-contain p-2 lg:max-h-[min(24rem,calc(100dvh-13rem))]">
              {displayedNotifications.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  {activeTab === "archive" ? "No archived notifications yet." : "No notifications right now."}
                </div>
              ) : (
                displayedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "rounded-lg border p-3 transition",
                      notification.isRead
                        ? "border-transparent text-slate-600 dark:text-slate-300"
                        : "border-primary/20 bg-primary/5 text-slate-950 dark:bg-primary/10 dark:text-white"
                    )}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openDetail(notification)}>
                        <span className="block truncate text-sm font-semibold">{notification.title}</span>
                        <span className="mt-1 block line-clamp-2 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">{notification.message}</span>
                        <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-400">
                          <Clock className="h-3 w-3" />
                          {formatTime(notification.createdAt)}
                        </span>
                      </button>
                      {activeTab === "archive" ? (
                        <button
                          type="button"
                          onClick={() => restoreNotification(notification)}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
                          aria-label="Restore notification"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => archiveNotification(notification)}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
                          aria-label="Archive notification"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {mounted && mobilePanelOpen ? createPortal(
        <div className="fixed inset-0 z-[9998] grid place-items-end bg-slate-950/55 p-3 backdrop-blur-sm lg:hidden">
          <button type="button" aria-label="Close notifications" className="absolute inset-0" onClick={() => setMobilePanelOpen(false)} />
          <div className="relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[#07152d]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-white/10">
              <div>
                <div className="text-lg font-semibold">Notifications</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{unreadCount} unread</div>
              </div>
              <Button type="button" variant="ghost" className="h-11 rounded-md px-3" onClick={markAllRead} disabled={!inboxNotifications.length}>
                <CheckCheck className="h-4 w-4" />
                Read all
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 border-b border-slate-200 p-3 dark:border-white/10">
              {(["inbox", "archive"] as NotificationTab[]).map((item) => (
                <button key={item} type="button" onClick={() => setActiveTab(item)} className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-md text-sm font-semibold", activeTab === item ? "bg-primary text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300")}>
                  {item === "inbox" ? <Inbox className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  {item === "inbox" ? "Inbox" : "Archive"}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {displayedNotifications.length === 0 ? (
                <div className="rounded-lg bg-slate-50 px-3 py-8 text-center text-sm text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">{activeTab === "archive" ? "No archived notifications yet." : "No notifications right now."}</div>
              ) : displayedNotifications.map((notification) => (
                <div key={notification.id} className={cn("mb-2 rounded-lg border p-3", notification.isRead ? "border-slate-200 dark:border-white/10" : "border-primary/25 bg-primary/5 dark:bg-primary/10")}>
                  <div className="flex items-start gap-3">
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openDetail(notification)}>
                      <span className="block truncate text-sm font-semibold">{notification.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{notification.message}</span>
                      <span className="mt-2 block text-[11px] font-bold uppercase text-slate-400">{formatTime(notification.createdAt)}</span>
                    </button>
                    <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300" onClick={() => activeTab === "archive" ? restoreNotification(notification) : archiveNotification(notification)}>
                      {activeTab === "archive" ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      {mounted && selectedNotification ? createPortal(
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-950 sm:max-h-[calc(100dvh-2rem)]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-white/10 sm:gap-4 sm:p-5">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase text-primary">{selectedNotification.type}</div>
                <h2 className="mt-1 break-words text-lg font-semibold sm:text-xl">{selectedNotification.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close notification"
              >
                <X className="h-7 w-7 stroke-[2.5]" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
              <p className="break-words text-sm leading-6 text-slate-700 dark:text-slate-300">{selectedNotification.message}</p>
              <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                <span className="font-semibold">Date & time:</span> {formatFullTime(selectedNotification.createdAt)}
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-4 dark:border-white/10 sm:flex-row sm:justify-end">
              {selectedNotification.archivedAt ? (
                <Button type="button" variant="secondary" onClick={() => restoreNotification(selectedNotification)}>
                  <RotateCcw className="h-4 w-4" />
                  Restore
                </Button>
              ) : (
                <Button type="button" variant="secondary" onClick={() => archiveNotification(selectedNotification)}>
                  <Archive className="h-4 w-4" />
                  Archive
                </Button>
              )}
              <Button type="button" onClick={() => setSelectedNotification(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
