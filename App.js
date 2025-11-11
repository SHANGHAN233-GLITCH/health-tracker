import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TranslationProvider } from './src/locales/TranslationProvider';

// Import screens
import DashboardScreen from './screens/DashboardScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import AIAssistantScreen from './screens/AIAssistantScreen';

import CoachScreen from './screens/CoachScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main Tabs Navigator
function MainTabs({ route }) {
  const { setIsAuthenticated } = route.params || {};
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Statistics') {
            iconName = focused ? 'chart-bar' : 'chart-bar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';

          } else if (route.name === 'Coach') {
            iconName = focused ? 'clipboard-text-clock' : 'clipboard-text-clock-outline';
          } else if (route.name === 'AIAssistant') {
            iconName = focused ? 'robot' : 'robot-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />

      <Tab.Screen name="Coach" component={CoachScreen} options={{ title: 'Coach' }} />
      <Tab.Screen name="AIAssistant" component={AIAssistantScreen} options={{ title: 'AI Assistant' }} />
      <Tab.Screen name="Statistics" component={StatisticsScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} initialParams={{ setIsAuthenticated }} />
    </Tab.Navigator>
  );
}

// Dashboard Stack Navigator
const DashboardStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} options={{ title: 'Dashboard' }} />
    </Stack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStack = ({ route }) => {
  const { setIsAuthenticated } = route.params || {};
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={UserProfileScreen} 
        options={{ title: 'Profile' }}
        initialParams={{ setIsAuthenticated }}
      />
    </Stack.Navigator>
  );
};

// Root Navigator that handles authentication flow
const RootNavigator = ({ isAuthenticated, setIsAuthenticated }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs} 
          initialParams={{ setIsAuthenticated }} // 传递setIsAuthenticated给MainTabs
        />
      ) : (
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            initialParams={{ setIsAuthenticated }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            initialParams={{ setIsAuthenticated }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (userToken) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    // You can replace this with a proper loading screen component
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <TranslationProvider>
          <NavigationContainer>
            <RootNavigator 
              isAuthenticated={isAuthenticated} 
              setIsAuthenticated={setIsAuthenticated} 
            />
          </NavigationContainer>
        </TranslationProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;