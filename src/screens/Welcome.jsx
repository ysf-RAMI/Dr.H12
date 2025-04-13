import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../../context/NotificationContext';
import axios from 'axios';

axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

const Welcome = () => {
  const [isReady, setIsReady] = useState(false);
  const navigation = useNavigation();
  const { expoPushToken } = useNotification();
  
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('@app_has_launched');
        const tokenSent = await AsyncStorage.getItem('@push_token_sent');
        
        if (hasLaunched === null) {
          await AsyncStorage.setItem('@app_has_launched', 'true');
        }
        
        if (tokenSent === null && expoPushToken) {
          try {
            await axios.post('http://192.168.3.41:8080/api/student/addExpoToken', {
              expoToken: expoPushToken
            });
            await AsyncStorage.setItem('@push_token_sent', 'true');
          } catch (error) {
            console.error('Failed to send push token:', error);
          }
        }

        if (hasLaunched !== null) {
          navigation.replace('Main');
          return;
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsReady(true);
      }
    };

    checkFirstLaunch();
  }, [expoPushToken]);

  const handleContinue = () => {
    // In the handleContinue function and useEffect
    navigation.replace('Main'); // Instead of 'Home'
  };

  if (!isReady) {
    return null; 
  }

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/welcome.jpg')}
        style={styles.image}
        resizeMode="contain"
      />
      
      <View style={styles.content}>
        <Text style={styles.title}>Doctor H1</Text>
        <Text style={styles.subtitle}>Educational Platform</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleContinue}
        >
          <MaterialIcons name="arrow-forward" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  image: {
    width: '80%',
    height: 300,
    marginBottom: 30,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#01162e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#4080be',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#01162e',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  }
});

export default Welcome;
