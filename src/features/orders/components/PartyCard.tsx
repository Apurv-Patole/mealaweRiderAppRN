import { Linking, View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import { mapsDirectionsUrl } from '@/lib/geo';

import type { OrderParty } from '../orderModel';

interface PartyCardProps {
  /** For example "Pickup from" or "Deliver to". */
  heading: string;
  party: OrderParty;
}

/** A kitchen or a customer: name, address, landmark, and Call and Navigate buttons. */
export function PartyCard({ heading, party }: PartyCardProps) {
  const { location, phone } = party;

  return (
    <Card className="gap-3">
      <AppText variant="caption" tone="muted">
        {heading}
      </AppText>
      <View className="gap-1">
        <AppText variant="title">{party.name}</AppText>
        {party.address ? <AppText>{party.address}</AppText> : null}
        {party.landmark ? (
          <AppText tone="muted">Landmark: {party.landmark}</AppText>
        ) : null}
        {!location ? (
          <AppText variant="caption" tone="muted">
            Map location is missing for this address.
          </AppText>
        ) : null}
      </View>
      <View className="flex-row gap-2">
        {phone ? (
          <View className="flex-1">
            <Button label="Call" size="md" variant="outline" onPress={() => void Linking.openURL(`tel:${phone}`)} />
          </View>
        ) : null}
        {location ? (
          <View className="flex-1">
            <Button
              label="Navigate"
              size="md"
              variant="outline"
              onPress={() => void Linking.openURL(mapsDirectionsUrl(location))}
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
}
