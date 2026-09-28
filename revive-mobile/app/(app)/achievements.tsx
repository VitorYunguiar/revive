import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { achievementProgress } from '@/domain/achievements';
import { useBootstrap } from '@/features/bootstrap/use-bootstrap';
import { AppButton, Card, LoadingState, PageTitle, Screen, textStyles } from '@/ui/components';
import { colors } from '@/ui/theme';
import { coverageLabel, formatDate } from '@/domain/metrics';

export default function AchievementsScreen() {
  const router = useRouter();
  const { data, isLoading } = useBootstrap();
  const badges = data ? achievementProgress(data) : [];
  const hasPendingProgress = data?.vicios.some((habit) => habit.progresso?.pendente) || false;
  return <Screen>
    <AppButton title="Voltar" variant="secondary" onPress={() => router.back()} />
    <PageTitle title="Conquistas" subtitle="Reconheça cada passo da sua jornada." />
    {isLoading && !data ? <LoadingState /> : <>
      {hasPendingProgress ? <Card><Text accessibilityLiveRegion="polite" style={textStyles.body}>Há uma alteração pendente. Os marcos permanentes abaixo refletem apenas o histórico confirmado no servidor.</Text></Card> : null}
      <Text style={textStyles.body}>{badges.filter((badge) => badge.earned).length} de {badges.length} marcos alcançados</Text>
      {badges.map((badge) => <Card key={badge.id}>
        <Text accessibilityRole="header" style={textStyles.heading}>{badge.label}</Text>
        <Text accessibilityLabel={`${badge.label}: ${badge.earned ? 'conquista permanente' : badge.legacyHistory ? 'histórico permanente indisponível neste snapshot antigo' : badge.unavailable ? 'histórico indisponível' : 'próximo marco'}. ${badge.unavailable ? 'Sem dados suficientes.' : `${Math.floor(badge.current ?? 0)} de ${badge.target}.`}`} style={textStyles.body}>
          {badge.earned ? 'Conquista permanente' : badge.legacyHistory ? 'Histórico permanente indisponível neste snapshot antigo' : badge.unavailable ? 'Histórico indisponível' : `Próximo marco: ${Math.floor(badge.current ?? 0)} de ${badge.target}`}
        </Text>
        {badge.award ? <Text style={textStyles.muted}>
          Reconhecido em {formatDate(badge.award.awarded_at)} · {badge.award.origem === 'legacy' ? 'registro legado' : badge.award.origem === 'snapshot_observation' ? 'reconhecido na sincronização' : 'período confirmado'} · {coverageLabel(badge.award.cobertura)}.
        </Text> : null}
        {!badge.unavailable ? <View accessibilityRole="progressbar" accessibilityLabel={`${badge.label}. ${badge.earned ? 'Conquista permanente; progresso atual' : 'Progresso atual'}`} accessibilityValue={{ min: 0, max: 100, now: Math.round(badge.percent) }} style={{ height: 8, backgroundColor: colors.border, borderRadius: 4 }}>
          <View style={{ width: `${badge.percent}%`, height: 8, backgroundColor: colors.primary, borderRadius: 4 }} />
        </View> : null}
      </Card>)}
    </>}
  </Screen>;
}
