import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { achievementProgress } from '@/domain/achievements';
import { useBootstrap } from '@/features/bootstrap/use-bootstrap';
import { AppButton, Card, LoadingState, PageTitle, Screen, textStyles } from '@/ui/components';
import { colors } from '@/ui/theme';

export default function AchievementsScreen() {
  const router = useRouter();
  const { data, isLoading } = useBootstrap();
  const badges = data ? achievementProgress(data) : [];
  return <Screen>
    <AppButton title="Voltar" variant="secondary" onPress={() => router.back()} />
    <PageTitle title="Conquistas" subtitle="Reconheça cada passo da sua jornada." />
    {isLoading && !data ? <LoadingState /> : <>
      <Text style={textStyles.body}>{badges.filter((badge) => badge.earned).length} de {badges.length} marcos alcançados</Text>
      {badges.map((badge) => <Card key={badge.id}>
        <Text style={textStyles.heading}>{badge.label}</Text>
        <Text style={textStyles.muted}>{badge.earned ? 'Alcançado' : `${Math.floor(badge.current)} de ${badge.target}`}</Text>
        <View accessibilityRole="progressbar" accessibilityLabel={badge.label} accessibilityValue={{ min: 0, max: 100, now: Math.round(badge.percent) }} style={{ height: 8, backgroundColor: colors.border, borderRadius: 4 }}>
          <View style={{ width: `${badge.percent}%`, height: 8, backgroundColor: colors.primary, borderRadius: 4 }} />
        </View>
      </Card>)}
    </>}
  </Screen>;
}
