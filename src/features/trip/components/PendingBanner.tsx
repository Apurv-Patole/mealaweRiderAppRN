import { View } from 'react-native';

import { AppText, Button, Card, StatusChip } from '@/components/ui';

import { failedActions, pendingActions } from '../actionQueue';
import { useActionQueueStore } from '../actionQueueStore';

/**
 * Shows updates that have not reached the server yet. Waiting ones send themselves when there is a
 * connection; ones the server refused (for example the customer cancelled) stay here with the reason
 * until the rider dismisses them.
 */
export function PendingBanner() {
  const items = useActionQueueStore((state) => state.items);
  const waiting = pendingActions(items);
  const failed = failedActions(items);

  if (waiting.length === 0 && failed.length === 0) return null;

  return (
    <View className="gap-3">
      {waiting.length > 0 ? (
        <Card className="gap-2">
          <StatusChip tone="ready" label="Waiting to send" />
          <AppText>
            {waiting.length === 1 ? '1 update is' : `${waiting.length} updates are`} saved on your phone and will be sent as
            soon as you have a connection.
          </AppText>
          {waiting.some((action) => action.error) ? (
            <AppText variant="caption" tone="muted">
              {waiting.find((action) => action.error)?.error}
            </AppText>
          ) : null}
          <Button
            label="Send now"
            size="md"
            variant="outline"
            onPress={() => void useActionQueueStore.getState().process()}
          />
        </Card>
      ) : null}

      {failed.map((action) => (
        <Card key={action.id} className="gap-2 border-danger">
          <StatusChip tone="cancelled" label="Not sent" />
          <AppText variant="label">
            Order #{action.orderNo} {action.kind === 'pickup' ? 'pickup' : 'delivery'}
          </AppText>
          <AppText>{action.error ?? 'This update could not be sent.'}</AppText>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                label="Dismiss"
                size="md"
                variant="outline"
                onPress={() => useActionQueueStore.getState().discard(action.id)}
              />
            </View>
            <View className="flex-1">
              <Button
                label="Try again"
                size="md"
                onPress={() => {
                  useActionQueueStore.getState().retry(action.id);
                  void useActionQueueStore.getState().process();
                }}
              />
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}
