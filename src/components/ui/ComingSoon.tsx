import { View } from 'react-native';

import { AppText } from './AppText';
import { Card } from './Card';
import { StatusChip } from './StatusChip';

interface ComingSoonProps {
  title: string;
  description: string;
  /** Plan stage that builds this screen, for example "Stage 3". */
  stage: string;
}

/** Placeholder for a tab whose stage has not been built yet. */
export function ComingSoon({ title, description, stage }: ComingSoonProps) {
  return (
    <View className="gap-4">
      <AppText variant="h1">{title}</AppText>
      <Card className="gap-3">
        <StatusChip tone="ready" label={`Planned: ${stage}`} />
        <AppText tone="muted">{description}</AppText>
      </Card>
    </View>
  );
}
