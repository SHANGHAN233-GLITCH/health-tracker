import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Title, Paragraph, RadioButton, SegmentedButtons, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NutritionCalculator from '../services/NutritionCalculator';

const UserProfileScreen = ({ navigation, route }) => {
  const { setIsAuthenticated } = route.params || {};
  // User profile state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goal, setGoal] = useState('maintain');
  const [fitnessGoals, setFitnessGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [nutrition, setNutrition] = useState(null);
  const [mealBreakdown, setMealBreakdown] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Load existing profile data
  useEffect(() => {
    loadUserData();
    loadProfileData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Calculate nutrition when profile data changes
  useEffect(() => {
    if (name && age && height && weight) {
      calculateNutrition();
    }
  }, [name, age, height, weight, gender, activityLevel, goal, fitnessGoals]);

  const loadProfileData = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        const profileData = JSON.parse(savedProfile);
        setName(profileData.name || '');
        setAge(profileData.age || '');
        setHeight(profileData.height || '');
        setWeight(profileData.weight || '');
        setGender(profileData.gender || 'male');
        setActivityLevel(profileData.activityLevel || 'moderate');
        setGoal(profileData.goal || 'maintain');
        setFitnessGoals(profileData.fitnessGoals || []);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const calculateNutrition = () => {
    const profileData = {
      name,
      age,
      height,
      weight,
      gender,
      activityLevel,
      goal,
      fitnessGoals
    };
    
    const nutritionData = NutritionCalculator.getDailyNutrition(profileData);
    setNutrition(nutritionData);
    
    const breakdown = NutritionCalculator.getMealBreakdown(nutritionData);
    setMealBreakdown(breakdown);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setSaveSuccess(false);
    
    try {
      const profileData = {
        name,
        age,
        height,
        weight,
        gender,
        activityLevel,
        goal,
        fitnessGoals,
        lastUpdated: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
      
      // Calculate and store nutrition data
      calculateNutrition();
      
      // Save target calories to AsyncStorage for Dashboard联动
      if (nutrition && nutrition.targetCalories) {
        await AsyncStorage.setItem('calorieTarget', nutrition.targetCalories.toString());
      }
      
      setSaveSuccess(true);
      
      // Show success message for 2 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      console.log('Starting logout process...');
      // 移除用户认证信息
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('currentUser');
      console.log('Auth tokens removed');
      
      // 确保调用setIsAuthenticated函数重置认证状态
      // RootNavigator会根据isAuthenticated状态自动切换到登录页面
      if (setIsAuthenticated) {
        console.log('Calling setIsAuthenticated(false)');
        setIsAuthenticated(false);
      } else {
        console.error('Critical error: setIsAuthenticated function is not available!');
        // 当setIsAuthenticated不可用时，尝试使用更基础的导航方法
        navigation.popToTop();
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const toggleFitnessGoal = (goal) => {
    setFitnessGoals(prevGoals => {
      if (prevGoals.includes(goal)) {
        return prevGoals.filter(g => g !== goal);
      } else {
        return [...prevGoals, goal];
      }
    });
  };

  // Calculate BMI if height and weight are provided
  const calculateBMI = () => {
    if (!height || !weight) return null;
    
    const heightInMeters = parseFloat(height) / 100;
    const weightInKg = parseFloat(weight);
    
    if (isNaN(heightInMeters) || isNaN(weightInKg) || heightInMeters <= 0) return null;
    
    return (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return '';
    const bmiValue = parseFloat(bmi);
    
    if (bmiValue < 18.5) return 'Underweight';
    if (bmiValue < 24.9) return 'Normal weight';
    if (bmiValue < 29.9) return 'Overweight';
    return 'Obese';
  };

  const bmi = calculateBMI();
  const bmiCategory = bmi ? getBMICategory(bmi) : '';

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Title style={styles.headerTitle}>User Profile</Title>
          <IconButton
            icon="logout"
            size={24}
            style={styles.logoutButton}
            onPress={handleLogout}
          />
        </View>
        
        {/* User Login Info Card */}
        {currentUser && (
          <Card style={[styles.card, styles.userInfoCard]}>
            <Card.Content style={styles.userInfoContent}>
              <View style={styles.userAvatar}>
                <MaterialCommunityIcons name="account-circle" size={60} color="#4CAF50" />
              </View>
              <View style={styles.userDetails}>
                <Title style={styles.userName}>{currentUser.name || 'User'}</Title>
                {currentUser.email && (
                  <Text style={styles.userContact}>{currentUser.email}</Text>
                )}
                {currentUser.phone && (
                  <Text style={styles.userContact}>{currentUser.phone}</Text>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Personal Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Personal Information</Title>
            
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Affix text="👤" />}
            />

            <View style={styles.row}>
              <TextInput
                label="Age"
                value={age}
                onChangeText={setAge}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                keyboardType="numeric"
                left={<TextInput.Affix text="📅" />}
              />
              
              <View style={styles.radioGroup}>
                <Text style={styles.sectionTitle}>Gender</Text>
                <RadioButton.Group onValueChange={value => setGender(value)} value={gender}>
                  <View style={styles.radioRow}>
                    <RadioButton.Android value="male" />
                    <Text>Male</Text>
                    <RadioButton.Android value="female" />
                    <Text>Female</Text>
                    <RadioButton.Android value="other" />
                    <Text>Other</Text>
                  </View>
                </RadioButton.Group>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Body Metrics Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Body Metrics</Title>
            
            <View style={styles.row}>
              <TextInput
                label="Height (cm)"
                value={height}
                onChangeText={setHeight}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                keyboardType="numeric"
                left={<TextInput.Affix text="📏" />}
              />
              
              <TextInput
                label="Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                keyboardType="numeric"
                left={<TextInput.Affix text="⚖️" />}
              />
            </View>

            {bmi && (
              <View style={styles.bmiContainer}>
                <Card style={styles.bmiCard}>
                  <Card.Content style={styles.bmiContent}>
                    <Text style={styles.bmiLabel}>BMI</Text>
                    <Text style={styles.bmiValue}>{bmi}</Text>
                    <Text style={styles.bmiCategory}>{bmiCategory}</Text>
                  </Card.Content>
                </Card>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Fitness Preferences Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Fitness Preferences</Title>
            
            <Text style={styles.sectionTitle}>Activity Level</Text>
            <SegmentedButtons
              value={activityLevel}
              onValueChange={setActivityLevel}
              buttons={[
                { value: 'sedentary', label: 'Sedentary' },
                { value: 'light', label: 'Light' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'active', label: 'Active' },
              ]}
              style={styles.segmentedButtons}
            />

            <Text style={styles.sectionTitle}>Fitness Goal</Text>
            <SegmentedButtons
              value={goal}
              onValueChange={setGoal}
              buttons={[
                { value: 'lose', label: 'Lose Weight' },
                { value: 'maintain', label: 'Maintain' },
                { value: 'gain', label: 'Gain Muscle' },
              ]}
              style={styles.segmentedButtons}
            />

            <Text style={styles.sectionTitle}>Favorite Activities</Text>
            <View style={styles.activitiesContainer}>
              {[
                { id: 'running', label: 'Running', icon: 'run' },
                { id: 'cycling', label: 'Cycling', icon: 'bike' },
                { id: 'swimming', label: 'Swimming', icon: 'swim' },
                { id: 'yoga', label: 'Yoga', icon: 'yoga' },
                { id: 'strength', label: 'Strength', icon: 'dumbbell' },
                { id: 'hiit', label: 'HIIT', icon: 'lightning-bolt' },
                { id: 'basketball', label: 'Basketball', icon: 'basketball' },
                { id: 'football', label: 'Football', icon: 'football' },
              ].map(activity => (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityButton,
                    fitnessGoals.includes(activity.id) && styles.activityButtonSelected
                  ]}
                  onPress={() => toggleFitnessGoal(activity.id)}
                >
                  <MaterialCommunityIcons 
                    name={activity.icon} 
                    size={24} 
                    color={fitnessGoals.includes(activity.id) ? '#fff' : '#4CAF50'}
                  />
                  <Text 
                    style={[
                      styles.activityLabel,
                      fitnessGoals.includes(activity.id) && styles.activityLabelSelected
                    ]}
                  >
                    {activity.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Nutrition Recommendations Card */}
        {nutrition && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Daily Nutrition Recommendations</Title>
              <Paragraph style={styles.recommendationNote}>Based on your profile information and fitness goals</Paragraph>
              
              {/* Calorie Information */}
              <View style={styles.nutritionSection}>
                <Text style={styles.nutritionSectionTitle}>Calories</Text>
                <View style={styles.calorieInfo}>
                  <View style={styles.calorieItem}>
                    <Text style={styles.calorieLabel}>BMR</Text>
                    <Text style={styles.calorieValue}>{nutrition.bmr} cal</Text>
                  </View>
                  <View style={styles.calorieItem}>
                    <Text style={styles.calorieLabel}>TDEE</Text>
                    <Text style={styles.calorieValue}>{nutrition.tdee} cal</Text>
                  </View>
                  <View style={[styles.calorieItem, styles.targetCalorieItem]}>
                    <Text style={styles.targetCalorieLabel}>Target Calories</Text>
                    <Text style={styles.targetCalorieValue}>{nutrition.targetCalories} cal</Text>
                  </View>
                </View>
              </View>
              
              {/* Macronutrients */}
              <View style={styles.nutritionSection}>
                <Text style={styles.nutritionSectionTitle}>Macronutrients (g)</Text>
                <View style={styles.macrosContainer}>
                  <View style={[styles.macroItem, styles.proteinItem]}>
                    <MaterialCommunityIcons name="food-drumstick-bite" size={24} color="#fff" />
                    <Text style={styles.macroValue}>{nutrition.protein}</Text>
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                  <View style={[styles.macroItem, styles.carbsItem]}>
                    <MaterialCommunityIcons name="food-pasta" size={24} color="#fff" />
                    <Text style={styles.macroValue}>{nutrition.carbs}</Text>
                    <Text style={styles.macroLabel}>Carbs</Text>
                  </View>
                  <View style={[styles.macroItem, styles.fatItem]}>
                    <MaterialCommunityIcons name="oil" size={24} color="#fff" />
                    <Text style={styles.macroValue}>{nutrition.fat}</Text>
                    <Text style={styles.macroLabel}>Fat</Text>
                  </View>
                </View>
              </View>
              
              {/* Meal Breakdown */}
              {mealBreakdown && (
                <View style={styles.nutritionSection}>
                  <Text style={styles.nutritionSectionTitle}>Meal Breakdown</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealScrollView}>
                    {[
                      { key: 'breakfast', label: 'Breakfast', icon: 'coffee' },
                      { key: 'lunch', label: 'Lunch', icon: 'food-fork-drink' },
                      { key: 'dinner', label: 'Dinner', icon: 'pot-steam' },
                      { key: 'snacks', label: 'Snacks', icon: 'cookie' }
                    ].map(meal => (
                      <Card key={meal.key} style={styles.mealCard}>
                        <Card.Content style={styles.mealCardContent}>
                          <MaterialCommunityIcons name={meal.icon} size={24} color="#4CAF50" />
                          <Text style={styles.mealLabel}>{meal.label}</Text>
                          <Text style={styles.mealCalories}>{mealBreakdown[meal.key].calories} cal</Text>
                          <View style={styles.mealMacros}>
                            <Text style={styles.mealMacroText}>P: {mealBreakdown[meal.key].protein}g</Text>
                            <Text style={styles.mealMacroText}>C: {mealBreakdown[meal.key].carbs}g</Text>
                            <Text style={styles.mealMacroText}>F: {mealBreakdown[meal.key].fat}g</Text>
                          </View>
                        </Card.Content>
                      </Card>
                    ))}
                  </ScrollView>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Save Button */}
        <Button
          mode="contained"
          onPress={handleSaveProfile}
          loading={loading}
          disabled={loading}
          style={styles.saveButton}
        >
          Save Profile
        </Button>

        {saveSuccess && (
          <Card style={styles.successCard}>
            <Card.Content style={styles.successContent}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
              <Text style={styles.successText}>Profile saved successfully!</Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  backButton: {
    margin: 0,
  },
  logoutButton: {
    margin: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfoCard: {
    backgroundColor: '#e8f5e9',
    marginTop: 15,
  },
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    marginRight: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#333',
    marginBottom: 5,
  },
  userContact: {
    color: '#666',
    fontSize: 14,
    marginBottom: 2,
  },
  card: {
    margin: 15,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  halfInput: {
    flex: 1,
    marginRight: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  radioGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  segmentedButtons: {
    marginBottom: 20,
  },
  activitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: '#fff',
  },
  activityButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  activityLabel: {
    marginLeft: 5,
    color: '#4CAF50',
  },
  activityLabelSelected: {
    color: '#fff',
  },
  saveButton: {
    margin: 15,
    paddingVertical: 5,
    backgroundColor: '#4CAF50',
  },
  successCard: {
    margin: 15,
    backgroundColor: '#e8f5e9',
    elevation: 1,
  },
  successContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    marginLeft: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  bmiContainer: {
    marginTop: 10,
  },
  bmiCard: {
    backgroundColor: '#e3f2fd',
  },
  bmiContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  bmiLabel: {
    fontSize: 16,
    color: '#666',
  },
  bmiValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  bmiCategory: {
    fontSize: 14,
    color: '#1565C0',
    marginTop: 5,
  },
  recommendationNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  nutritionSection: {
    marginBottom: 20,
  },
  nutritionSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  calorieInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  calorieItem: {
    alignItems: 'center',
    flex: 1,
  },
  targetCalorieItem: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e0e0e0',
  },
  calorieLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  calorieValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  targetCalorieLabel: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  targetCalorieValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  proteinItem: {
    backgroundColor: '#FF6B6B',
  },
  carbsItem: {
    backgroundColor: '#4ECDC4',
  },
  fatItem: {
    backgroundColor: '#FFD166',
  },
  macroValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 5,
  },
  macroLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  mealScrollView: {
    flexDirection: 'row',
  },
  mealCard: {
    width: 140,
    marginRight: 10,
    elevation: 2,
  },
  mealCardContent: {
    alignItems: 'center',
  },
  mealLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#333',
  },
  mealCalories: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginVertical: 5,
  },
  mealMacros: {
    width: '100%',
  },
  mealMacroText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default UserProfileScreen;