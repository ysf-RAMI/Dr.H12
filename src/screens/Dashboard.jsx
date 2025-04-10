import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './AdminDashboard';
import { Buffer } from 'buffer';
import axios from 'axios';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkUserAuth();
    });
    return unsubscribe;
  }, [navigation]);

  const checkUserAuth = async () => {
    try {
      setLoading(true);
      const authData = await AsyncStorage.getItem('auth');
      console.log('Auth Data:', authData);
      
      if (!authData) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }, { name: 'Main' }],
        });
        return;
      }
  
      const { token } = JSON.parse(authData);
      console.log('Token:', token);
      
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        
        const decoded = JSON.parse(decodeURIComponent(
          escape(Buffer.from(base64, 'base64').toString('ascii'))
        ));
        
      
        if (decoded && decoded.role) {
          const role = Array.isArray(decoded.role) ? decoded.role[0] : decoded.role;
          setUserRole(role);
          
          if (decoded.sub) setUserName(decoded.sub);
          if (decoded.email) setUserEmail(decoded.email);
         
          if (role !== 'ROLE_ADMIN' && role !== 'ROLE_PROFESSEUR') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }
        } else {
          throw new Error('Invalid role in token');
        }
      } catch (decodeError) {
        console.log('Token decode error:', decodeError);
        throw new Error('Invalid token format');
      }
    } catch (error) {
      console.log('Authentication error:', error);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } finally {
      setLoading(false);
    }
  };

 

  

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
      
            
       <>
       {userRole === 'ROLE_ADMIN' && <AdminDashboard userName={userName} email={userEmail} />}
       {userRole === 'ROLE_PROFESSEUR' && <TeacherDashboard userName={userName} email={userEmail} />}
              
       
       </>
        
       

  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
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
  header: {
    backgroundColor: '#6200ee',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  userInfo: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  userEmail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default Dashboard;