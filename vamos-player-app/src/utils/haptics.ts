/**
 * Haptics Utility for Vamos Player App
 * Uses the Web Vibration API to provide physical feedback on mobile devices.
 */
export const haptics = {
    /**
     * Subtle pulse for normal interactions
     */
    light: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    },

    /**
     * Medium impact for success or important selections
     */
    medium: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(30);
        }
    },

    /**
     * Strong impact for major events (Victory, New Challenge)
     */
    heavy: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 30, 50]);
        }
    },

    /**
     * Triple pulse for ultimate success (Tournament Win, Level Up)
     */
    victory: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100, 50, 200]);
        }
    },

    /**
     * Erratic pulse for errors or warnings
     */
    error: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 100, 50, 100]);
        }
    }
};
