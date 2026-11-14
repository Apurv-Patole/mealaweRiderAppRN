import { Stack, useRouter } from 'expo-router';
import { Camera, FileImage, Images } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dialog } from '@/components/dialog/dialog';
import { AppText, Avatar, Button, Card, ChoiceChips, SectionTitle, TextField } from '@/components/ui';
import { PHONE } from '@/config/constants';
import { digitsOnly } from '@/features/auth';
import { pickDocument, PickerPermissionError } from '@/features/register/documentPicker';
import { BLOOD_GROUPS } from '@/features/register/leadForm';
import {
  draftFromRaw,
  imageUrlsFromRaw,
  PROFILE_DOCUMENTS,
  PROFILE_PHOTO,
  validateProfile,
  type EditAddress,
  type PhotoFile,
  type ProfileDraft,
  type ProfileErrors,
} from '@/features/profile/profileEdit';
import { fetchProfileDetails, saveProfile } from '@/features/profile/profileApi';
import { useAuthStore } from '@/store';
import { useColors } from '@/theme';
import { haptics } from '@/utils/haptics';

const PHOTO_SIZE = 96;
const PINCODE_LENGTH = 6;

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

/** Change your photo, contact details, bank and UPI details, and home address. Your phone number cannot be changed. */
export default function EditProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const rider = useAuthStore((state) => state.rider);

  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, PhotoFile>>({});
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchProfileDetails()
      .then((raw) => {
        if (cancelled) return;
        setDraft(draftFromRaw(raw));
        setImageUrls(imageUrlsFromRaw(raw));
        setLoadFailed(false);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function update(patch: Partial<ProfileDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function updateAddress(patch: Partial<EditAddress>) {
    setDraft((current) => (current ? { ...current, residenceAddress: { ...current.residenceAddress, ...patch } } : current));
  }

  async function choosePicture(key: string, label: string, source: 'camera' | 'library') {
    try {
      const file = await pickDocument(source, key);
      if (file) setFiles((current) => ({ ...current, [key]: file }));
    } catch (error: unknown) {
      const message = error instanceof PickerPermissionError ? error.message : 'Could not open the picker. Please try again.';
      void dialog.error({ title: `${label} not added`, message });
    }
  }

  async function changePicture(key: string, label: string) {
    const choice = await dialog.choose({
      title: label,
      message: 'Choose how to add the picture',
      options: [
        { value: 'camera', label: 'Take a photo', hint: 'Use the camera', icon: Camera },
        { value: 'library', label: 'Choose from gallery', hint: 'Pick an existing picture', icon: Images },
      ],
    });
    if (choice === 'camera' || choice === 'library') await choosePicture(key, label, choice);
  }

  async function save() {
    if (!draft || !rider) return;
    const found = validateProfile(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      haptics.error();
      return;
    }
    setSaving(true);
    try {
      const updated = await saveProfile(draft, files, rider.phoneNo);
      useAuthStore.getState().setRider(updated ?? { ...rider, name: draft.name.trim() });
      haptics.confirm();
      await dialog.success({ title: 'Profile updated', message: 'Your changes have been saved.' });
      router.back();
    } catch (error: unknown) {
      haptics.error();
      void dialog.error({ title: 'Could not save', message: messageFor(error) });
    } finally {
      setSaving(false);
    }
  }

  const header = <Stack.Screen options={{ headerShown: true, title: 'Edit profile' }} />;

  if (loadFailed) {
    return (
      <View className="flex-1 justify-center gap-3 p-6" style={{ backgroundColor: colors.background }}>
        {header}
        <AppText className="text-center">We could not load your profile.</AppText>
        <Button
          label="Try again"
          variant="outline"
          onPress={() => {
            setLoadFailed(false);
            setAttempt((count) => count + 1);
          }}
        />
      </View>
    );
  }

  if (!draft) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        {header}
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const shownPhoto = files[PROFILE_PHOTO.key]?.uri ?? (imageUrls[PROFILE_PHOTO.key] || null);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior="padding">
      {header}
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="items-center gap-2 py-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            onPress={() => void changePicture(PROFILE_PHOTO.key, PROFILE_PHOTO.label)}
            style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}>
            {shownPhoto ? (
              <Image source={{ uri: shownPhoto }} style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: PHOTO_SIZE / 2 }} />
            ) : (
              <Avatar name={draft.name} size={PHOTO_SIZE} />
            )}
            <View
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
                borderWidth: 3,
                borderColor: colors.background,
              }}>
              <Camera size={16} color={colors.primaryForeground} />
            </View>
          </Pressable>
          <AppText variant="caption" tone="muted">
            Tap to change your photo
          </AppText>
        </View>

        <SectionTitle>Personal</SectionTitle>
        <Card className="gap-4">
          <TextField label="Full name" value={draft.name} onChangeText={(name) => update({ name })} autoCapitalize="words" error={errors.name} />
          <TextField label="Phone number" value={rider?.phoneNo ?? ''} prefix="+91" editable={false} />
          <AppText variant="caption" tone="muted" style={{ marginTop: -8 }}>
            Your phone number is your login and cannot be changed here.
          </AppText>
          <TextField
            label="Email"
            value={draft.email}
            onChangeText={(email) => update({ email })}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />
          <TextField
            label="Emergency contact"
            value={draft.emergencyContactNo}
            onChangeText={(value) => update({ emergencyContactNo: digitsOnly(value, PHONE.length) })}
            keyboardType="number-pad"
            placeholder="10-digit number"
            error={errors.emergencyContactNo}
          />
          <ChoiceChips
            label="Blood group"
            options={BLOOD_GROUPS}
            value={draft.bloodGroup}
            onChange={(bloodGroup) => update({ bloodGroup })}
          />
        </Card>

        <SectionTitle>Bank and UPI</SectionTitle>
        <Card className="gap-4">
          <TextField label="Account holder" value={draft.bankAccountHolder} onChangeText={(bankAccountHolder) => update({ bankAccountHolder })} autoCapitalize="words" />
          <TextField label="Bank name" value={draft.bankName} onChangeText={(bankName) => update({ bankName })} autoCapitalize="words" />
          <TextField label="Account number" value={draft.bankAccountNo} onChangeText={(value) => update({ bankAccountNo: digitsOnly(value, 20) })} keyboardType="number-pad" />
          <TextField
            label="IFSC code"
            value={draft.bankIfscCode}
            onChangeText={(value) => update({ bankIfscCode: value.toUpperCase() })}
            autoCapitalize="characters"
            error={errors.bankIfscCode}
          />
          <TextField label="Branch" value={draft.bankBranch} onChangeText={(bankBranch) => update({ bankBranch })} autoCapitalize="words" />
          <TextField label="UPI ID" value={draft.upiId} onChangeText={(upiId) => update({ upiId })} autoCapitalize="none" placeholder="name@bank" error={errors.upiId} />
        </Card>

        <SectionTitle>ID documents</SectionTitle>
        <Card className="gap-3">
          <AppText variant="caption" tone="muted">
            Tap a document to replace its picture. Pictures you do not change stay as they are.
          </AppText>
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {PROFILE_DOCUMENTS.map((doc) => {
              const uri = files[doc.key]?.uri ?? (imageUrls[doc.key] || null);
              return (
                <Pressable
                  key={doc.key}
                  accessibilityRole="button"
                  accessibilityLabel={`${doc.label}. ${uri ? 'Tap to replace' : 'Tap to add'}`}
                  onPress={() => void changePicture(doc.key, doc.label)}
                  style={{ width: '47.5%' }}>
                  <View
                    style={{
                      height: 110,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: files[doc.key] ? colors.primary : colors.border,
                      backgroundColor: colors.muted,
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {uri ? (
                      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <FileImage size={28} color={colors.mutedForeground} />
                    )}
                    <View
                      style={{
                        position: 'absolute',
                        right: 6,
                        bottom: 6,
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.primary,
                      }}>
                      <Camera size={14} color={colors.primaryForeground} />
                    </View>
                  </View>
                  <AppText variant="caption" tone="muted" style={{ marginTop: 6 }}>
                    {doc.label}
                    {files[doc.key] ? ' · new' : ''}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <SectionTitle>Home address</SectionTitle>
        <Card className="gap-4">
          <TextField label="Address line 1" value={draft.residenceAddress.line1} onChangeText={(line1) => updateAddress({ line1 })} />
          <TextField label="Address line 2" value={draft.residenceAddress.line2} onChangeText={(line2) => updateAddress({ line2 })} />
          <TextField label="City" value={draft.residenceAddress.city} onChangeText={(city) => updateAddress({ city })} autoCapitalize="words" />
          <TextField label="State" value={draft.residenceAddress.state} onChangeText={(state) => updateAddress({ state })} autoCapitalize="words" />
          <TextField
            label="Pincode"
            value={draft.residenceAddress.pincode}
            onChangeText={(value) => updateAddress({ pincode: digitsOnly(value, PINCODE_LENGTH) })}
            keyboardType="number-pad"
            error={errors['residenceAddress.pincode']}
          />
        </Card>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        }}>
        <Button label="Save changes" loading={saving} onPress={() => void save()} />
      </View>
    </KeyboardAvoidingView>
  );
}
