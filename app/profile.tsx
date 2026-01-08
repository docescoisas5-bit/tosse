import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/adminService';
import { AnimatedCard } from '../components/AnimatedCard';
import { AnimatedButton } from '../components/AnimatedButton';

export default function ProfileScreen() {
  const { user, userProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, [userProfile]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await adminService.getCurrentUserProfile();
      setProfile(data);
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Confirmar Logout',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('Erro', 'Não foi possível fazer logout');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>👤 Meu Perfil</Text>

        <AnimatedCard delay={0}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.email}>{user?.email || 'N/A'}</Text>
            {profile && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {profile.role === 'admin' ? '👑 Administrador' : '👤 Usuário'}
                </Text>
              </View>
            )}
          </View>
        </AnimatedCard>

        {profile && (
          <AnimatedCard delay={100}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Membro desde:</Text>
              <Text style={styles.infoValue}>
                {new Date(profile.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>
            {profile.updated_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Última atualização:</Text>
                <Text style={styles.infoValue}>
                  {new Date(profile.updated_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            )}
          </AnimatedCard>
        )}

        <AnimatedCard delay={200} style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Ações</Text>
          <AnimatedButton
            title="📊 Ver Estatísticas"
            onPress={() => router.push('/stats')}
            variant="secondary"
            style={styles.actionButton}
          />
          <AnimatedButton
            title="📋 Ver Histórico"
            onPress={() => router.push('/history')}
            variant="secondary"
            style={styles.actionButton}
          />
          <AnimatedButton
            title="❓ Ajuda"
            onPress={() => router.push('/tutorial')}
            variant="secondary"
            style={styles.actionButton}
          />
        </AnimatedCard>

        <AnimatedButton
          title="🚪 Sair"
          onPress={handleSignOut}
          variant="danger"
          style={styles.signOutButton}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionsCard: {
    marginTop: 16,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  signOutButton: {
    marginTop: 24,
    marginBottom: 32,
  },
});

