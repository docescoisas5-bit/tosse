import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface TabItem {
  name: string;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  route: string;
}

const tabs: TabItem[] = [
  { name: 'home', label: 'Início', iconName: 'home', route: '/home' },
  { name: 'history', label: 'Histórico', iconName: 'time', route: '/history' },
  { name: 'tutorial', label: 'Ajuda', iconName: 'help-circle', route: '/tutorial' },
  { name: 'about', label: 'Sobre', iconName: 'information-circle', route: '/about' },
  { name: 'profile', label: 'Perfil', iconName: 'person', route: '/profile' },
];

export function BottomTabNavigator() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (route: string) => {
    return pathname === route;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.tabBar}>
          {tabs.map((tab, index) => {
            const active = isActive(tab.route);
            return (
              <TabButton
                key={tab.name}
                tab={tab}
                active={active}
                onPress={() => router.push(tab.route as any)}
                index={index}
              />
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

interface TabButtonProps {
  tab: TabItem;
  active: boolean;
  onPress: () => void;
  index: number;
}

function TabButton({ tab, active, onPress, index }: TabButtonProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (active) {
      Animated.spring(scaleAnim, {
        toValue: 1.15,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  }, [active]);

  return (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.tabContent,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            active && styles.iconContainerActive,
          ]}
        >
          <Ionicons
            name={tab.iconName}
            size={24}
            color={active ? '#FFFFFF' : '#666'}
          />
        </View>
        <Text style={[styles.label, active && styles.labelActive]}>
          {tab.label}
        </Text>
      </Animated.View>
      {active && <View style={styles.indicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  gradient: {
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 70,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: '#1a1a1a',
    shadowColor: '#1a1a1a',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  label: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  labelActive: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 3,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
  },
});

