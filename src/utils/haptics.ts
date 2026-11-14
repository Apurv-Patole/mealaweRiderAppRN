import * as Haptics from 'expo-haptics';

function fire(effect: () => Promise<void>): void {
  // A failing haptic (unsupported device, permission stripped) must never break a tap.
  void effect().catch(() => undefined);
}

/** The app's one haptics entry point, so the feedback taxonomy stays reviewable in one place. */
export const haptics = {
  /** Ordinary button press. */
  tap: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A step that matters: pickup confirmed, delivery completed. */
  confirm: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Something went wrong or was refused. */
  error: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
