/**
 * Safe Browser Fullscreen Service
 * Handles cross-browser feature detection and user-gesture triggered fullscreen requests.
 * Catches and suppresses rejections silently so gameplay is never blocked.
 */

export async function requestGameFullscreen(target?: HTMLElement | null): Promise<boolean> {
  try {
    if (typeof document === 'undefined') return false;

    // Check if already in fullscreen
    const currentFs =
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement;

    if (currentFs) {
      return true;
    }

    // Select the CodeXcape gameplay app root container
    const element =
      target ||
      document.getElementById('root') ||
      document.documentElement;

    if (!element) return false;

    if (element.requestFullscreen) {
      await element.requestFullscreen();
      return true;
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
      return true;
    } else if ((element as any).mozRequestFullScreen) {
      await (element as any).mozRequestFullScreen();
      return true;
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
      return true;
    }
  } catch {
    // Safe graceful degradation: Browsers may reject if blocked by iframe, permissions, or platform restrictions.
    // Continues mission startup smoothly without showing unneeded error popups.
  }
  return false;
}

export function isGameFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}
