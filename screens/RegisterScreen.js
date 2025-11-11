import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, Title, SegmentedButtons, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen = ({ navigation, route }) => {
  const { setIsAuthenticated } = route.params || {};
  const [registrationType, setRegistrationType] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    // Basic phone validation (adjust as needed)
    return phone.length > 9;
  };

  const handleRegister = async () => {
    // Validation
    if (!name || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (registrationType === 'email' && (!email || !validateEmail(email))) {
      setError('Please enter a valid email');
      return;
    }

    if (registrationType === 'phone' && (!phone || !validatePhone(phone))) {
      setError('Please enter a valid phone number');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get existing users
      const users = await AsyncStorage.getItem('users');
      const parsedUsers = users ? JSON.parse(users) : [];

      // Check if user already exists
      const userExists = parsedUsers.some(
        (u) => u.email === email || u.phone === phone
      );

      if (userExists) {
        setError('User with this email or phone already exists');
        return;
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name,
        email: registrationType === 'email' ? email : '',
        phone: registrationType === 'phone' ? phone : '',
        password,
        createdAt: new Date().toISOString(),
      };

      // Save new user
      parsedUsers.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(parsedUsers));
      
      // Store authentication token
      await AsyncStorage.setItem('userToken', 'mock-token');
      await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));

      setSuccess('Registration successful!');
      
      // Auto login the user
      if (setIsAuthenticated) {
        setTimeout(() => {
          setIsAuthenticated(true);
        }, 1500);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Title style={styles.headerTitle}>Create Account</Title>
          <Text style={styles.headerSubtitle}>Join Health Tracker to get started</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.formContainer}>
            <SegmentedButtons
              value={registrationType}
              onValueChange={setRegistrationType}
              buttons={[
                { value: 'email', label: 'Email' },
                { value: 'phone', label: 'Phone' },
              ]}
              style={styles.segmentButtons}
            />

            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="account" />}
            />

            {registrationType === 'email' ? (
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                mode="outlined"
                left={<TextInput.Icon icon="email" />}
              />
            ) : (
              <TextInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                keyboardType="phone-pad"
                mode="outlined"
                left={<TextInput.Icon icon="phone" />}
                placeholder="+123 456 7890"
              />
            )}

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              helperText="At least 6 characters"
            />

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="lock-check" />}
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.registerButton}
              loading={loading}
              disabled={loading}
            >
              Create Account
            </Button>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        <Text style={styles.termsText}
          onPress={() => console.log('Terms pressed')}
        >
          By registering, you agree to our Terms of Service and Privacy Policy
        </Text>
      </ScrollView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
        action={{ label: 'Close', onPress: () => setError('') }}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess('')}
        duration={3000}
        style={{ backgroundColor: '#4CAF50' }}
      >
        {success}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    marginTop: 10,
    marginBottom: 15,
    alignSelf: 'flex-start',
    padding: 5,
  },
  headerContainer: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  card: {
    elevation: 3,
    borderRadius: 12,
  },
  formContainer: {
    paddingVertical: 20,
  },
  segmentButtons: {
    marginBottom: 25,
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  registerButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  termsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 30,
    paddingHorizontal: 10,
  },
});

export default RegisterScreen;
