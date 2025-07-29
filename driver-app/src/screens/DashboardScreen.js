import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { getDriverProfile, logoutDriver } from '../services/api';
import { APP_CONFIG, STORAGE_KEYS } from '../constants/config';

export default function DashboardScreen({ onLogout }) {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDriverProfile();
  }, []);

  const loadDriverProfile = async () => {
    try {
      // First try to get cached data
      const cachedData = await SecureStore.getItemAsync(STORAGE_KEYS.DRIVER_DATA);
      if (cachedData) {
        setDriver(JSON.parse(cachedData));
      }

      // Then fetch fresh data
      const result = await getDriverProfile();
      if (result.success) {
        setDriver(result.driver);
      } else {
        Alert.alert('خطأ', result.message);
      }
    } catch (error) {
      console.error('Load profile error:', error);
      Alert.alert('خطأ', 'فشل في تحميل بيانات السائق');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDriverProfile();
  };

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من رغبتك في تسجيل الخروج؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            const success = await logoutDriver();
            if (success) {
              onLogout();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>مرحباً</Text>
              <Text style={styles.driverName}>{driver?.fullName || 'السائق'}</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Driver Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={24} color={APP_CONFIG.primaryColor} />
            <Text style={styles.cardTitle}>معلومات السائق</Text>
          </View>
          <View style={styles.driverInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>الاسم:</Text>
              <Text style={styles.infoValue}>{driver?.fullName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>البريد الإلكتروني:</Text>
              <Text style={styles.infoValue}>{driver?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>رقم الهاتف:</Text>
              <Text style={styles.infoValue}>{driver?.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>الحالة:</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: driver?.isActive ? '#10B981' : '#EF4444' }]} />
                <Text style={[styles.statusText, { color: driver?.isActive ? '#10B981' : '#EF4444' }]}>
                  {driver?.isActive ? 'نشط' : 'غير نشط'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Orders Section - Coming Soon */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={24} color={APP_CONFIG.primaryColor} />
            <Text style={styles.cardTitle}>الطلبات</Text>
          </View>
          <View style={styles.comingSoon}>
            <Ionicons name="construct-outline" size={48} color="#9CA3AF" />
            <Text style={styles.comingSoonText}>قريباً...</Text>
            <Text style={styles.comingSoonSubtext}>
              سيتم إضافة إدارة الطلبات في التحديث القادم
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} disabled>
            <Ionicons name="notifications-outline" size={32} color="#9CA3AF" />
            <Text style={styles.actionButtonText}>الإشعارات</Text>
            <Text style={styles.actionButtonSubtext}>قريباً</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} disabled>
            <Ionicons name="location-outline" size={32} color="#9CA3AF" />
            <Text style={styles.actionButtonText}>الموقع</Text>
            <Text style={styles.actionButtonSubtext}>قريباً</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>
            تطبيق باكيتي للسواق - الإصدار {APP_CONFIG.version}
          </Text>
          <Text style={styles.appInfoSubtext}>
            للدعم التقني: 07511856947
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_CONFIG.backgroundColor,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_CONFIG.textColor,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_CONFIG.textColor,
    marginLeft: 12,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  driverInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: APP_CONFIG.textColor,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  comingSoon: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  actionButtonSubtext: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  appInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  appInfoSubtext: {
    fontSize: 12,
    color: '#D1D5DB',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
});