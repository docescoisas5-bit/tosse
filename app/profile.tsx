import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/adminService';
import { supabaseService } from '../services/supabase';
import { AnimatedCard } from '../components/AnimatedCard';
import { AnimatedButton } from '../components/AnimatedButton';
import { BottomTabNavigator } from '../components/BottomTabNavigator';
import { UserProfile } from '../types';

export default function ProfileScreen() {
  const { user, userProfile, signOut, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Campos editáveis
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, [userProfile]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await adminService.getCurrentUserProfile();
      if (data) {
        setProfile(data);
        setName(data.name || '');
        setAddress(data.address || '');
        setPhotoUrl(data.photo_url || null);
      }
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPhotoUrl(asset.uri);
      }
    } catch (error: any) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    try {
      setSaving(true);

      // Upload da foto se foi selecionada uma nova
      let finalPhotoUrl = photoUrl;
      if (photoUrl && photoUrl.startsWith('file://')) {
        finalPhotoUrl = await supabaseService.uploadProfilePhoto(user.id, photoUrl);
      }

      // Atualiza o perfil
      await supabaseService.updateProfile(user.id, {
        name: name.trim() || undefined,
        address: address.trim() || undefined,
        photo_url: finalPhotoUrl || undefined,
      });

      // Atualiza a senha se fornecida
      if (newPassword) {
        if (newPassword.length < 6) {
          Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
          setSaving(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          Alert.alert('Erro', 'As senhas não coincidem');
          setSaving(false);
          return;
        }
        await supabaseService.updatePassword(newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      // Recarrega o perfil
      if (refreshUserProfile) {
        await refreshUserProfile();
      }
      await loadProfile();
      
      setIsEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', error.message || 'Não foi possível salvar o perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setName(profile.name || '');
      setAddress(profile.address || '');
      setPhotoUrl(profile.photo_url || null);
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditing(false);
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

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Usuário';
  const displayPhoto = photoUrl || profile?.photo_url;

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
            <TouchableOpacity
              onPress={isEditing ? handlePickImage : undefined}
              disabled={!isEditing}
              style={styles.avatarContainer}
            >
              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {isEditing && (
                <View style={styles.editPhotoBadge}>
                  <Text style={styles.editPhotoText}>📷</Text>
                </View>
              )}
            </TouchableOpacity>
            
            {!isEditing ? (
              <>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.email}>{user?.email || 'N/A'}</Text>
                {profile?.address && (
                  <Text style={styles.address}>📍 {profile.address}</Text>
                )}
                {profile && (
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>
                      {profile.role === 'admin' ? '👑 Administrador' : '👤 Usuário'}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.editFields}>
                <TextInput
                  style={styles.input}
                  placeholder="Nome completo"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Endereço"
                  value={address}
                  onChangeText={setAddress}
                  placeholderTextColor="#999"
                  multiline
                />
              </View>
            )}
          </View>
        </AnimatedCard>

        {profile && !isEditing && (
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

        {isEditing && (
          <AnimatedCard delay={100}>
            <Text style={styles.sectionTitle}>Alterar Senha (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Nova senha"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholderTextColor="#999"
            />
            <Text style={styles.hint}>
              Deixe em branco se não quiser alterar a senha
            </Text>
          </AnimatedCard>
        )}

        {!isEditing ? (
          <>
            <AnimatedCard delay={200} style={styles.actionsCard}>
              <Text style={styles.actionsTitle}>Ações</Text>
              <AnimatedButton
                title="✏️ Editar Perfil"
                onPress={() => setIsEditing(true)}
                variant="primary"
                style={styles.actionButton}
              />
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
            </AnimatedCard>

            <AnimatedButton
              title="🚪 Sair"
              onPress={handleSignOut}
              variant="danger"
              style={styles.signOutButton}
            />
          </>
        ) : (
          <View style={styles.editActions}>
            <AnimatedButton
              title={saving ? "Salvando..." : "💾 Salvar"}
              onPress={handleSaveProfile}
              variant="primary"
              style={styles.actionButton}
              disabled={saving}
            />
            <AnimatedButton
              title="❌ Cancelar"
              onPress={handleCancelEdit}
              variant="secondary"
              style={styles.actionButton}
              disabled={saving}
            />
          </View>
        )}
      </ScrollView>
      <BottomTabNavigator />
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
    paddingBottom: 100, // Espaço para a barra de navegação inferior
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
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  avatarText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
  },
  editPhotoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  editPhotoText: {
    fontSize: 18,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  editFields: {
    width: '100%',
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
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
  editActions: {
    marginTop: 16,
  },
  signOutButton: {
    marginTop: 24,
    marginBottom: 32,
  },
});
