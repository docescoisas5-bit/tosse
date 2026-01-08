import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/adminService';
import { AnimatedCard } from '../components/AnimatedCard';
import { AnimatedButton } from '../components/AnimatedButton';
import { UserProfile, Analysis, AdminStats } from '../types';

const { width } = Dimensions.get('window');

export default function AdminScreen() {
  const { user, isAdmin, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'analyses' | 'audios'>('stats');
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [audios, setAudios] = useState<Array<{ path: string; size: number; created_at: string }>>([]);
  
  // Modal de criar usuário
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [creatingUser, setCreatingUser] = useState(false);

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Acesso Negado', 'Você não tem permissão para acessar esta página.');
      router.replace('/home');
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    loadData();
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'stats') {
        const statsData = await adminService.getStats();
        setStats(statsData);
      } else if (activeTab === 'users') {
        const usersData = await adminService.getAllUsers();
        setUsers(usersData);
      } else if (activeTab === 'analyses') {
        const analysesData = await adminService.getAllAnalyses();
        setAnalyses(analysesData);
      } else if (activeTab === 'audios') {
        const audiosData = await adminService.listAllAudios();
        setAudios(audiosData);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', error.message || 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }

    if (newUserPassword.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setCreatingUser(true);
    try {
      await adminService.createUser(newUserEmail, newUserPassword, newUserRole);
      Alert.alert('Sucesso', 'Usuário criado com sucesso!');
      setShowCreateUser(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      loadData();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível criar o usuário.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar o usuário "${userEmail}"?\n\nEsta ação não pode ser desfeita e deletará todos os dados do usuário.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteUser(userId);
              Alert.alert('Sucesso', 'Usuário deletado com sucesso.');
              loadData();
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Não foi possível deletar o usuário.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja deletar esta análise?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteAnalysis(analysisId);
              Alert.alert('Sucesso', 'Análise deletada com sucesso.');
              loadData();
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Não foi possível deletar a análise.');
            }
          },
        },
      ]
    );
  };

  const handleUpdateUserRole = async (userId: string, currentRole: 'user' | 'admin', newRole: 'user' | 'admin') => {
    if (currentRole === newRole) return;

    Alert.alert(
      'Alterar Role',
      `Deseja alterar o role deste usuário para ${newRole}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await adminService.updateUserRole(userId, newRole);
              Alert.alert('Sucesso', 'Role atualizado com sucesso.');
              loadData();
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Não foi possível atualizar o role.');
            }
          },
        },
      ]
    );
  };

  const handleViewUserAnalyses = async (userId: string, userEmail: string) => {
    try {
      const userAnalyses = await adminService.getUserAnalyses(userId);
      Alert.alert(
        `Análises de ${userEmail}`,
        `Total de análises: ${userAnalyses.length}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível carregar as análises.');
    }
  };

  const handlePlayAudio = async (audioPath: string) => {
    try {
      const audioUrl = await adminService.getAudioUrl(audioPath);
      Alert.alert(
        'URL do Áudio',
        `URL gerada com sucesso!\n\n${audioUrl.substring(0, 80)}...`,
        [
          { text: 'OK' },
          {
            text: 'Copiar URL',
            onPress: () => handleCopyUrl(audioUrl),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível obter a URL do áudio.');
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await Clipboard.setStringAsync(url);
      Alert.alert('Sucesso', 'URL copiada para a área de transferência!');
    } catch (error: any) {
      console.error('Erro ao copiar URL:', error);
      Alert.alert('Erro', 'Não foi possível copiar a URL.');
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Verificando permissões...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>⚙️ Painel Administrativo</Text>
            <Text style={styles.subtitle}>{user?.email}</Text>
          </Animated.View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <AnimatedButton
              title="📊 Stats"
              onPress={() => setActiveTab('stats')}
              variant={activeTab === 'stats' ? 'primary' : 'secondary'}
              style={[styles.tabButton, activeTab === 'stats' && styles.tabButtonActive]}
            />
            <AnimatedButton
              title="👥 Users"
              onPress={() => setActiveTab('users')}
              variant={activeTab === 'users' ? 'primary' : 'secondary'}
              style={[styles.tabButton, activeTab === 'users' && styles.tabButtonActive]}
            />
            <AnimatedButton
              title="📋 Analyses"
              onPress={() => setActiveTab('analyses')}
              variant={activeTab === 'analyses' ? 'primary' : 'secondary'}
              style={[styles.tabButton, activeTab === 'analyses' && styles.tabButtonActive]}
            />
            <AnimatedButton
              title="🎵 Audios"
              onPress={() => setActiveTab('audios')}
              variant={activeTab === 'audios' ? 'primary' : 'secondary'}
              style={[styles.tabButton, activeTab === 'audios' && styles.tabButtonActive]}
            />
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.loadingText}>Carregando...</Text>
            </View>
          ) : (
            <View style={styles.contentArea}>
              {activeTab === 'stats' && stats && (
                <View style={styles.statsContainer}>
                  <AnimatedCard delay={0}>
                    <View style={styles.statCard}>
                      <Text style={styles.statIcon}>👥</Text>
                      <Text style={styles.statValue}>{stats.total_users}</Text>
                      <Text style={styles.statLabel}>Total de Usuários</Text>
                    </View>
                  </AnimatedCard>
                  <AnimatedCard delay={100}>
                    <View style={styles.statCard}>
                      <Text style={styles.statIcon}>📊</Text>
                      <Text style={styles.statValue}>{stats.total_analyses}</Text>
                      <Text style={styles.statLabel}>Total de Análises</Text>
                    </View>
                  </AnimatedCard>
                  <AnimatedCard delay={200}>
                    <View style={styles.statCard}>
                      <Text style={styles.statIcon}>👑</Text>
                      <Text style={styles.statValue}>{stats.total_admins}</Text>
                      <Text style={styles.statLabel}>Administradores</Text>
                    </View>
                  </AnimatedCard>
                  <AnimatedCard delay={300}>
                    <View style={styles.statCard}>
                      <Text style={styles.statIcon}>✅</Text>
                      <Text style={styles.statValue}>{stats.users_with_analyses}</Text>
                      <Text style={styles.statLabel}>Usuários com Análises</Text>
                    </View>
                  </AnimatedCard>
                  <AnimatedCard delay={400}>
                    <View style={styles.statCard}>
                      <Text style={styles.statIcon}>🎯</Text>
                      <Text style={styles.statValue}>
                        {(stats.avg_confidence * 100).toFixed(1)}%
                      </Text>
                      <Text style={styles.statLabel}>Confiança Média</Text>
                    </View>
                  </AnimatedCard>
                </View>
              )}

              {activeTab === 'users' && (
                <View style={styles.listContainer}>
                  <AnimatedButton
                    title="➕ Criar Novo Usuário"
                    onPress={() => setShowCreateUser(true)}
                    variant="success"
                    style={styles.createButton}
                  />
                  
                  {users.map((userProfile, index) => (
                    <AnimatedCard key={userProfile.id} delay={index * 50}>
                      <View style={styles.userCard}>
                        <View style={styles.userHeader}>
                          <View style={styles.userInfo}>
                            <Text style={styles.userEmail}>{userProfile.email}</Text>
                            <View style={styles.userMeta}>
                              <View style={[styles.roleBadge, userProfile.role === 'admin' && styles.roleBadgeAdmin]}>
                                <Text style={styles.roleBadgeText}>
                                  {userProfile.role === 'admin' ? '👑 Admin' : '👤 User'}
                                </Text>
                              </View>
                              <Text style={styles.userDate}>
                                {new Date(userProfile.created_at).toLocaleDateString('pt-BR')}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.userActions}>
                          <AnimatedButton
                            title={userProfile.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                            onPress={() =>
                              handleUpdateUserRole(
                                userProfile.id,
                                userProfile.role,
                                userProfile.role === 'admin' ? 'user' : 'admin'
                              )
                            }
                            variant={userProfile.role === 'admin' ? 'danger' : 'warning'}
                            style={styles.actionButtonSmall}
                          />
                          <AnimatedButton
                            title="Ver Análises"
                            onPress={() => handleViewUserAnalyses(userProfile.id, userProfile.email)}
                            variant="secondary"
                            style={styles.actionButtonSmall}
                          />
                          <AnimatedButton
                            title="🗑️ Deletar"
                            onPress={() => handleDeleteUser(userProfile.id, userProfile.email)}
                            variant="danger"
                            style={styles.actionButtonSmall}
                          />
                        </View>
                      </View>
                    </AnimatedCard>
                  ))}
                </View>
              )}

              {activeTab === 'analyses' && (
                <View style={styles.listContainer}>
                  {analyses.map((analysis, index) => {
                    const diagnosis = analysis.diagnosis as any;
                    return (
                      <AnimatedCard key={analysis.id} delay={index * 50}>
                        <View style={styles.analysisCard}>
                          <View style={styles.analysisHeader}>
                            <Text style={styles.analysisTitle}>
                              {diagnosis.predictedClass?.toUpperCase() || 'N/A'}
                            </Text>
                            <Text style={styles.analysisConfidence}>
                              {(diagnosis.confidence * 100).toFixed(1)}% confiança
                            </Text>
                          </View>
                          <View style={styles.analysisDetails}>
                            <Text style={styles.analysisDetail}>
                              Normal: {(diagnosis.normal * 100).toFixed(1)}%
                            </Text>
                            <Text style={styles.analysisDetail}>
                              Bronquite: {(diagnosis.bronchitis * 100).toFixed(1)}%
                            </Text>
                            <Text style={styles.analysisDetail}>
                              Pneumonia: {(diagnosis.pneumonia * 100).toFixed(1)}%
                            </Text>
                          </View>
                          <Text style={styles.analysisDate}>
                            {new Date(analysis.created_at).toLocaleString('pt-BR')}
                          </Text>
                          <AnimatedButton
                            title="🗑️ Deletar"
                            onPress={() => handleDeleteAnalysis(analysis.id)}
                            variant="danger"
                            style={styles.deleteButton}
                          />
                        </View>
                      </AnimatedCard>
                    );
                  })}
                </View>
              )}

              {activeTab === 'audios' && (
                <View style={styles.listContainer}>
                  {audios.map((audio, index) => (
                    <AnimatedCard key={index} delay={index * 50}>
                      <View style={styles.audioCard}>
                        <Text style={styles.audioPath} numberOfLines={1}>
                          {audio.path}
                        </Text>
                        <Text style={styles.audioMeta}>
                          📦 {(audio.size / 1024).toFixed(2)} KB | 📅{' '}
                          {audio.created_at
                            ? new Date(audio.created_at).toLocaleString('pt-BR')
                            : 'Data não disponível'}
                        </Text>
                        <View style={styles.audioActions}>
                          <AnimatedButton
                            title="🎵 Ouvir"
                            onPress={() => handlePlayAudio(audio.path)}
                            variant="success"
                            style={styles.audioButton}
                          />
                          <AnimatedButton
                            title="📋 Copiar URL"
                            onPress={async () => {
                              try {
                                const audioUrl = await adminService.getAudioUrl(audio.path);
                                await handleCopyUrl(audioUrl);
                              } catch (error: any) {
                                Alert.alert('Erro', error.message || 'Não foi possível obter a URL do áudio.');
                              }
                            }}
                            variant="secondary"
                            style={styles.audioButton}
                          />
                        </View>
                      </View>
                    </AnimatedCard>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <AnimatedButton
              title="🏠 Voltar para Home"
              onPress={() => router.push('/home')}
              variant="secondary"
              style={styles.footerButton}
            />
            <AnimatedButton
              title="🚪 Sair"
              onPress={signOut}
              variant="danger"
              style={styles.footerButton}
            />
          </View>
        </ScrollView>

        {/* Modal de Criar Usuário */}
        <Modal
          visible={showCreateUser}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCreateUser(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>➕ Criar Novo Usuário</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={newUserEmail}
                onChangeText={setNewUserEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Senha (mínimo 6 caracteres)"
                placeholderTextColor="#999"
                value={newUserPassword}
                onChangeText={setNewUserPassword}
                secureTextEntry
              />
              
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    newUserRole === 'user' && styles.roleOptionActive,
                  ]}
                  onPress={() => setNewUserRole('user')}
                >
                  <Text style={[styles.roleOptionText, newUserRole === 'user' && styles.roleOptionTextActive]}>
                    👤 Usuário
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    newUserRole === 'admin' && styles.roleOptionActive,
                  ]}
                  onPress={() => setNewUserRole('admin')}
                >
                  <Text style={[styles.roleOptionText, newUserRole === 'admin' && styles.roleOptionTextActive]}>
                    👑 Admin
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <AnimatedButton
                  title="Cancelar"
                  onPress={() => {
                    setShowCreateUser(false);
                    setNewUserEmail('');
                    setNewUserPassword('');
                    setNewUserRole('user');
                  }}
                  variant="secondary"
                  style={styles.modalButton}
                  disabled={creatingUser}
                />
                <AnimatedButton
                  title={creatingUser ? 'Criando...' : 'Criar'}
                  onPress={handleCreateUser}
                  variant="primary"
                  style={styles.modalButton}
                  disabled={creatingUser}
                />
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  tabButton: {
    flex: 1,
    minWidth: (width - 60) / 4,
  },
  tabButtonActive: {
    opacity: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
  },
  contentArea: {
    gap: 16,
  },
  statsContainer: {
    gap: 16,
  },
  statCard: {
    alignItems: 'center',
    padding: 20,
  },
  statIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  listContainer: {
    gap: 16,
  },
  createButton: {
    marginBottom: 8,
  },
  userCard: {
    gap: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleBadgeAdmin: {
    backgroundColor: '#FFE5E5',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  userDate: {
    fontSize: 12,
    color: '#999',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButtonSmall: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
  },
  analysisCard: {
    gap: 12,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  analysisConfidence: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  analysisDetails: {
    gap: 6,
  },
  analysisDetail: {
    fontSize: 14,
    color: '#666',
  },
  analysisDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  deleteButton: {
    marginTop: 8,
  },
  audioCard: {
    gap: 12,
  },
  audioPath: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  audioMeta: {
    fontSize: 12,
    color: '#666',
  },
  audioActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  audioButton: {
    flex: 1,
  },
  footer: {
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  footerButton: {
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  roleOptionActive: {
    borderColor: '#667eea',
    backgroundColor: '#E7F3FF',
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  roleOptionTextActive: {
    color: '#667eea',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
