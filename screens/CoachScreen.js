import React, { useState, useEffect } from 'react';
import { useTranslation } from '../src/locales/TranslationProvider';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Avatar, Badge, ProgressBar, RadioButton, Surface, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CoachScreen = ({ navigation }) => {
  const { translations } = useTranslation();
  const [userData, setUserData] = useState(null);
  const [todayCalories, setTodayCalories] = useState(0);
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [bmi, setBmi] = useState(null);
  const [calorieDiff, setCalorieDiff] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [dietRecommendations, setDietRecommendations] = useState([]);
  const [exerciseRecommendations, setExerciseRecommendations] = useState([]);
  const [calorieProgress, setCalorieProgress] = useState(0);
  const [bmiStandard, setBmiStandard] = useState('chinese'); // 'chinese' or 'who'
  const [selectedExercise, setSelectedExercise] = useState(null);
  
  // AI chat related state
  // AI assistant functionality has been moved to a separate page

  // Calculate BMI
  const calculateBMI = (weight, height) => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    const bmiValue = weight / (heightInMeters * heightInMeters);
    return parseFloat(bmiValue.toFixed(1));
  };

  // Get BMI category (supports Chinese and WHO standards)
  const getBMICategory = (bmi) => {
    if (bmiStandard === 'chinese') {
      // Chinese standard
      if (bmi < 18.5) return { label: 'Underweight', color: '#2196F3' };
      if (bmi < 24) return { label: 'Normal Range', color: '#4CAF50' };
      if (bmi < 28) return { label: 'Overweight', color: '#FFC107' };
      return { label: 'Obese', color: '#F44336' };
    } else {
      // WHO standard
      if (bmi < 18.5) return { label: 'Underweight', color: '#2196F3' };
      if (bmi < 25) return { label: 'Normal Range', color: '#4CAF50' };
      if (bmi < 30) return { label: 'Overweight', color: '#FFC107' };
      return { label: 'Obese', color: '#F44336' };
    }
  };

  // Calculate exercise time to burn calories
  const calculateExerciseTime = (exerciseType, calories) => {
    // Calorie burn rate for different exercises (calories/minute)
    const exerciseRates = {
      'walking': 5,    // Brisk walking (6km/h)
      'jogging': 10,   // Jogging (8km/h)
      'skipping': 15   // Jump rope
    };
    
    const rate = exerciseRates[exerciseType] || 5;
    const minutes = Math.ceil(calories / rate);
    return minutes;
  };

  // Save BMI standard setting
  const saveBmiStandard = async (standard) => {
    try {
      await AsyncStorage.setItem('bmiStandard', standard);
      setBmiStandard(standard);
    } catch (error) {
      console.error('Failed to save BMI standard:', error);
    }
  };

  // Load BMI standard settings
  const loadBmiStandard = async () => {
    try {
      const savedStandard = await AsyncStorage.getItem('bmiStandard');
      if (savedStandard) {
        setBmiStandard(savedStandard);
      }
    } catch (error) {
      console.error('Failed to load BMI standard:', error);
    }
  };
  
  // AI assistant functionality has been moved to a separate page
  
  // Calculate calorie progress percentage
  const calculateCalorieProgress = () => {
    if (calorieTarget === 0) return 0;
    const progress = (todayCalories / calorieTarget) * 100;
    return Math.min(progress, 100); // Ensure not exceeding 100%
  };
  
  // Get calorie status color
  const getCalorieStatusColor = () => {
    const progress = calculateCalorieProgress();
    if (progress < 70) return '#4CAF50'; // Normal range
    if (progress < 90) return '#FFC107'; // Approaching target
    return '#F44336'; // Exceeded target
  };

  // Generate recommendations based on BMI and calorie difference
  const generateRecommendations = () => {
    const generalSuggestions = [];
    const dietSuggestions = [];
    const exerciseSuggestions = [];
    
    // Calorie difference advice
    if (Math.abs(calorieDiff) > 0) {
      if (calorieDiff > 0) {
        generalSuggestions.push({
          title: 'Intake Insufficient Today',
          description: `You need about ${calorieDiff} more calories to reach your daily goal. Consider adding some healthy snacks.`,
          icon: 'food-apple',
          color: '#FFC107'
        });
        
        // Provide different dinner/snack advice based on BMI
        if (bmi) {
          const gap = calorieDiff;
          
          // Provide specific dinner/snack advice based on calorie deficit
          if (gap < 200) {
            dietSuggestions.push({
              title: 'Light Dinner Suggestion',
              description: 'Recommended: A simple vegetable soup or fruit salad with a handful of nuts to add energy without overloading your digestive system.',
              icon: 'food-apple'
            });
          } else if (gap < 400) {
            dietSuggestions.push({
              title: 'Balanced Dinner Recommendation',
              description: 'Suggestion: Lean protein (chicken breast/fish) with steamed vegetables and a small portion of whole grains for balanced nutrients.',
              icon: 'food-steak'
            });
          } else {
            dietSuggestions.push({
              title: 'Nutrient-Rich Dinner',
              description: 'Recommended: A high-protein, low-fat main dish with plenty of complex carbohydrates and vegetables for balanced nutrition.',
              icon: 'silverware'
            });
          }
          
          // Additional advice based on BMI
          if (bmi < 18.5) {
            dietSuggestions.push({
              title: 'Muscle Gain Snack',
              description: 'Consider adding high-protein snacks between meals, such as Greek yogurt with protein powder, milk with oats, or nuts with fruits to help build muscle.',
              icon: 'food-drumstick'
            });
          }
        }
      } else {
        generalSuggestions.push({
          title: 'Intake Exceeded Today',
          description: `You've exceeded your goal by about ${Math.abs(calorieDiff)} calories today. Consider increasing exercise to burn off the excess.`,
          icon: 'run',
          color: '#F44336'
        });
        
        // Exercise recommendations based on excess calories - supporting walking/jogging/skipping
        const excess = Math.abs(calorieDiff);
        
        // Generate specific exercise options
        exerciseSuggestions.push({
          title: 'Exercise Burn Plan',
          description: `You need to burn ${excess} calories to reach today's goal. Choose one of the following exercise options:`,
          icon: 'fitness-center',
          exerciseOptions: [
            {
              type: 'walking',
              name: 'Brisk Walking',
              icon: 'walk',
              time: calculateExerciseTime('walking', excess),
              description: `Need to walk briskly for about ${calculateExerciseTime('walking', excess)} minutes (6km/h)`
            },
            {
              type: 'jogging',
              name: 'Jogging',
              icon: 'run',
              time: calculateExerciseTime('jogging', excess),
              description: `Need to jog for about ${calculateExerciseTime('jogging', excess)} minutes (8km/h)`
            },
            {
              type: 'skipping',
              name: 'Skipping Rope',
              icon: 'jump-rope',
              time: calculateExerciseTime('skipping', excess),
              description: `Need to skip rope for about ${calculateExerciseTime('skipping', excess)} minutes`
            }
          ]
        });
      }
    }

    // BMI-related recommendations
    if (bmi) {
      const category = getBMICategory(bmi);
      
      if (bmi < 18.5) {
        generalSuggestions.push({
          title: 'Increase Nutrient Intake',
          description: 'Your weight is below the recommended range. You should increase nutrient intake and engage in appropriate muscle-building exercises.',
          icon: 'nutrition',
          color: '#2196F3'
        });
        
        dietSuggestions.push({
          title: 'Weight Gain Meal Plan',
          description: 'Eat 5-6 meals daily, increasing healthy fats (nuts, olive oil), quality protein (fish, chicken, legumes), and complex carbs (brown rice, whole grain bread).',
          icon: 'silverware'
        });
        
        exerciseSuggestions.push({
          title: 'Strength Training Plan',
          description: '3-4 strength training sessions per week, focusing on large muscle groups with compound movements like squats, deadlifts, and bench presses.',
          icon: 'dumbbell'
        });
      } else if (bmi < 24) {
        generalSuggestions.push({
          title: translations.maintainGoodStatus || 'Maintain Good Status',
          description: translations.weightInIdealRange || 'Your weight is in the ideal range! Continue with balanced diet and regular exercise.',
          icon: 'thumb-up',
          color: '#4CAF50'
        });
        
        dietSuggestions.push({
          title: translations.maintainHealthyDiet || 'Maintain Healthy Diet',
          description: translations.balancedNutrition || 'Maintain balanced intake of protein, carbs, and fats. Eat plenty of fruits and vegetables. Limit processed foods and refined sugars.',
          icon: 'food-variant'
        });
        
        exerciseSuggestions.push({
          title: translations.comprehensiveExercise || 'Comprehensive Exercise Plan',
          description: translations.balanceTraining || '3-5 workouts per week combining cardio, strength, and flexibility training for balanced physical development.',
          icon: 'fitness-center'
        });
      } else if (bmi < 28) {
        generalSuggestions.push({
          title: translations.controlWeight || 'Control Weight Appropriately',
          description: translations.weightSlightlyHigh || 'Your weight is slightly above recommended. Adjusting diet and increasing exercise can improve your health significantly.',
          icon: 'scale-balance',
          color: '#FFC107'
        });
        
        dietSuggestions.push({
          title: translations.fatLossDiet || 'Fat Loss Diet Strategy',
          description: translations.calorieControl || 'Control daily calorie intake (300-500 calories less than expenditure), increase vegetable and protein intake, reduce refined carbs and saturated fats.',
          icon: 'salad'
        });
        
        exerciseSuggestions.push({
          title: translations.fatLossExercise || 'Fat Loss Exercise Combination',
          description: translations.combineAerobicStrength || 'Exercise 5 times weekly, including 3 cardio sessions (45 minutes each) and 2 strength training sessions to boost metabolism and muscle ratio.',
          icon: 'run'
        });
      } else {
        generalSuggestions.push({
          title: translations.healthyWeightLoss || 'Healthy Weight Loss Plan',
          description: translations.gradualWeightLoss || 'Consider a gradual weight loss plan combining dietary control and regular exercise to improve health progressively.',
          icon: 'chart-line',
          color: '#F44336'
        });
        
        dietSuggestions.push({
          title: translations.weightLossDiet || 'Healthy Weight Loss Diet',
          description: translations.lowCalorieNutrient || 'Adopt a low-calorie, nutrient-dense diet, increase fiber intake, control portion sizes, avoid high-sugar and high-fat foods.',
          icon: 'nutrition'
        });
        
        exerciseSuggestions.push({
          title: translations.gradualExercise || 'Progressive Exercise Plan',
          description: translations.startLowIntensity || 'Start with low-intensity cardio (like walking), gradually increase duration and intensity. Aim for at least 150 minutes of moderate exercise weekly.',
          icon: 'footprints'
        });
      }
    }

    // General health recommendations
    generalSuggestions.push({
      title: translations.stayHydrated || 'Stay Hydrated',
      description: translations.drinkEnoughWater || 'Drinking enough water daily aids metabolism and overall health. Aim for at least 8 glasses of water per day.',
      icon: 'water',
      color: '#00BCD4'
    });

    generalSuggestions.push({
      title: translations.adequateSleep || 'Adequate Sleep',
      description: translations.qualitySleep || 'Good sleep is essential for health. Aim for 7-9 hours of quality sleep each night.',
      icon: 'sleep',
      color: '#9C27B0'
    });

    setRecommendations(generalSuggestions);
    setDietRecommendations(dietSuggestions);
    setExerciseRecommendations(exerciseSuggestions);
  };

  // Load data function - moved to top level to make it visible throughout the component
  const loadData = async () => {
    try {
      // Load user data
      const userDataJson = await AsyncStorage.getItem('userData');
      if (userDataJson) {
        const userData = JSON.parse(userDataJson);
        setUserData(userData);
        
        // Calculate BMI
        if (userData.weight && userData.height) {
          const bmiValue = calculateBMI(userData.weight, userData.height);
          setBmi(bmiValue);
        }
      }

      // Load calorie target
      const savedTarget = await AsyncStorage.getItem('calorieTarget');
      if (savedTarget) {
        setCalorieTarget(parseInt(savedTarget));
      }

      // Load today's calorie intake
      const mealsJson = await AsyncStorage.getItem('meals');
      if (mealsJson) {
        const mealsData = JSON.parse(mealsJson);
        const today = new Date().toISOString().split('T')[0];
        const todayMeals = mealsData.filter(meal => meal.date === today);
        const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
        setTodayCalories(totalCalories);
        setCalorieDiff(calorieTarget - totalCalories);
      }

      // Load BMI standard setting
      loadBmiStandard();
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // Initial data loading
  useEffect(() => {
    loadData();
  }, []);
  
  // Recalculate and generate suggestions when health data is updated
  useEffect(() => {
    setCalorieDiff(calorieTarget - todayCalories);
    setCalorieProgress(calculateCalorieProgress());
    generateRecommendations();
  }, [bmi, todayCalories, calorieTarget, bmiStandard]);
  
  useEffect(() => {
    // Listen for page focus changes
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);
  
  // Update calorie progress
  useEffect(() => {
    setCalorieProgress(calculateCalorieProgress());
  }, [todayCalories, calorieTarget]);

  // Generate suggestions when data changes
  useEffect(() => {
    generateRecommendations();
  }, [bmi, calorieDiff]);

  return (
    <ScrollView style={styles.container}>
      {/* Personal Status Summary */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Today's Status</Title>
          
          {/* Calorie Intake Progress Bar */}
          <View style={styles.calorieProgressContainer}>
            <View style={styles.calorieProgressHeader}>
              <Text style={styles.calorieProgressLabel}>Calorie Intake Progress</Text>
              <Text style={styles.calorieProgressValue}>
                {todayCalories} / {calorieTarget} kcal ({Math.round(calorieProgress)}%)
              </Text>
            </View>
            <ProgressBar 
              progress={calorieProgress / 100} 
              color={getCalorieStatusColor()}
              style={styles.progressBar}
            />
            <Text style={[
              styles.calorieDiffText,
              { color: calorieDiff >= 0 ? '#4CAF50' : '#F44336' }
            ]}>
              {calorieDiff >= 0 ? `Remaining: ${calorieDiff} kcal` : `Exceeded: ${Math.abs(calorieDiff)} kcal`}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            {bmi && (
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>BMI</Text>
                <View style={styles.bmiContainer}>
                  <Text style={styles.statusValue}>{bmi}</Text>
                  {getBMICategory(bmi) && (
                    <Badge style={[styles.bmiBadge, { backgroundColor: getBMICategory(bmi).color }]}>
                      {getBMICategory(bmi).label}
                    </Badge>
                  )}
                </View>
                {/* BMI Standard Switch */}
                <View style={styles.bmiStandardContainer}>
                  <Text style={styles.bmiStandardLabel}>Standard:</Text>
                  <RadioButton
                    value="chinese"
                    status={bmiStandard === 'chinese' ? 'checked' : 'unchecked'}
                    onPress={() => saveBmiStandard('chinese')}
                    color="#4CAF50"
                  />
                  <Text style={styles.bmiStandardText}>China</Text>
                  <RadioButton
                    value="who"
                    status={bmiStandard === 'who' ? 'checked' : 'unchecked'}
                    onPress={() => saveBmiStandard('who')}
                    color="#2196F3"
                  />
                  <Text style={styles.bmiStandardText}>WHO</Text>
                </View>
              </View>
            )}
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Ideal Weight</Text>
              {userData?.height && (
                <Text style={styles.statusValue}>
                  {(Math.pow(userData.height / 100, 2) * (bmiStandard === 'chinese' ? 22 : 22.5)).toFixed(1)} kg
                </Text>
              )}
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Today's Steps</Text>
              <Text style={styles.statusValue}>
                {userData?.stepsToday || 0}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Smart Recommendations */}
      <View style={styles.recommendationsSection}>
        <Title style={styles.sectionTitle}>Comprehensive Advice</Title>
        {recommendations.map((rec, index) => (
          <Card key={index} style={styles.recommendationCard}>
            <Card.Content style={styles.recommendationContent}>
              <Avatar.Icon
                icon={rec.icon}
                size={40}
                color={rec.color}
                style={[styles.recommendationIcon, { backgroundColor: `${rec.color}20` }]}
              />
              <View style={styles.recommendationTextContainer}>
                <Title style={styles.recommendationTitle}>{rec.title}</Title>
                <Paragraph style={styles.recommendationDescription}>{rec.description}</Paragraph>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
      
      {/* Diet Recommendations */}
      {dietRecommendations.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Title style={styles.sectionTitle}>{translations.dietAdvice || '饮食建议'}</Title>
          {dietRecommendations.map((rec, index) => (
            <Card key={index} style={styles.recommendationCard}>
              <Card.Content style={styles.recommendationContent}>
                <Avatar.Icon
                  icon={rec.icon}
                  size={40}
                  color="#2196F3"
                  style={[styles.recommendationIcon, { backgroundColor: '#2196F320' }]}
                />
                <View style={styles.recommendationTextContainer}>
                  <Title style={styles.recommendationTitle}>{rec.title}</Title>
                  <Paragraph style={styles.recommendationDescription}>{rec.description}</Paragraph>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}
      
      {/* Exercise Recommendations */}
      {exerciseRecommendations.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Title style={styles.sectionTitle}>{translations.exerciseAdvice || '运动建议'}</Title>
          {exerciseRecommendations.map((rec, index) => (
            <Card key={index} style={styles.recommendationCard}>
              <Card.Content style={styles.recommendationContent}>
                <Avatar.Icon
                  icon={rec.icon}
                  size={40}
                  color="#4CAF50"
                  style={[styles.recommendationIcon, { backgroundColor: '#4CAF5020' }]}
                />
                <View style={styles.recommendationTextContainer}>
                  <Title style={styles.recommendationTitle}>{rec.title}</Title>
                  <Paragraph style={styles.recommendationDescription}>{rec.description}</Paragraph>
                  
                  {/* Exercise Options Selection */}
                  {rec.exerciseOptions && (
                    <View style={styles.exerciseOptionsContainer}>
                      {rec.exerciseOptions.map((option, optIndex) => (
                        <TouchableOpacity
                          key={optIndex}
                          style={[
                            styles.exerciseOption,
                            selectedExercise === option.type && styles.exerciseOptionSelected
                          ]}
                          onPress={() => setSelectedExercise(option.type)}
                        >
                          <MaterialCommunityIcons 
                            name={option.icon} 
                            size={24} 
                            color={selectedExercise === option.type ? '#2196F3' : '#4CAF50'} 
                          />
                          <View style={styles.exerciseOptionContent}>
                            <Text style={[
                              styles.exerciseOptionName,
                              selectedExercise === option.type && styles.exerciseOptionNameSelected
                            ]}>{option.name}</Text>
                            <Text style={styles.exerciseOptionDescription}>{option.description}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Action Plan */}
      {/* AI assistant functionality moved to separate page */}
      
      {/* Action Plan */}
      <Card style={styles.actionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Today's Action Plan</Title>
          <View style={styles.actionContainer}>
            <Button
              mode="contained"
              icon="food"
              style={styles.actionButton}
              onPress={() => navigation.navigate('Dashboard')}
            >
              View Today's Meals
            </Button>
            <Button
              mode="contained"
              icon="plus-circle"
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => navigation.navigate('AddMeal')}
            >
              Add Meal
            </Button>
          </View>
          <View style={[styles.actionContainer, { marginTop: 10 }]}>
            <Button
              mode="contained"
              icon="chart-line"
              style={[styles.actionButton, { flex: 1 }]}
              onPress={() => navigation.navigate('Statistics')}
            >
              View Statistics
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  summaryCard: {
    margin: 15,
    elevation: 2,
  },
  cardTitle: {
    marginBottom: 15,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  bmiContainer: {
    alignItems: 'center',
  },
  bmiBadge: {
    marginTop: 5,
  },
  bmiStandardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  bmiStandardLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 5,
  },
  bmiStandardText: {
    fontSize: 12,
    color: '#333',
    marginRight: 5,
  },
  recommendationsSection: {
    paddingHorizontal: 15,
  },
  sectionTitle: {
    marginBottom: 10,
    color: '#333',
  },
  recommendationCard: {
    marginBottom: 10,
    elevation: 2,
  },
  recommendationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationIcon: {
    marginRight: 15,
  },
  recommendationTextContainer: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    marginBottom: 5,
  },
  recommendationDescription: {
    color: '#666',
    fontSize: 14,
    marginBottom: 10,
  },
  actionCard: {
    margin: 15,
    marginTop: 20,
    elevation: 2,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    marginVertical: 5,
    backgroundColor: '#4CAF50',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  calorieProgressContainer: {
    marginBottom: 10,
  },
  calorieProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calorieProgressLabel: {
    fontSize: 14,
    color: '#666',
  },
  calorieProgressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
  calorieDiffText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'right',
    fontWeight: '500',
  },
  exerciseOptionsContainer: {
    marginTop: 10,
  },
  exerciseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  exerciseOptionContent: {
    marginLeft: 10,
    flex: 1,
  },
  exerciseOptionName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  exerciseOptionNameSelected: {
    color: '#2196F3',
  },
  exerciseOptionDescription: {
    fontSize: 13,
    color: '#666',
  },
  
  // AI chat related styles
  aiAssistantCard: {
    marginVertical: 5,
  },
  aiAssistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  aiAssistantTitleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  aiAssistantTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  aiAssistantSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  chatContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  chatMessagesList: {
    height: 300,
    marginBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    marginHorizontal: 5,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginHorizontal: 5,
  },
  messageBubble: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '75%',
  },
  userMessageBubble: {
    backgroundColor: '#E3F2FD',
    marginRight: 5,
  },
  aiMessageBubble: {
    backgroundColor: '#f0f0f0',
    marginLeft: 5,
  },
  messageText: {
    fontSize: 15,
  },
  userMessageText: {
    color: '#0D47A1',
  },
  aiMessageText: {
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  analyzeButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginVertical: 10,
    alignSelf: 'center',
  },
  analyzeButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButton: {
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#b0bec5',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  clearButtonText: {
    color: '#f44336',
    fontSize: 14,
  },
});

export default CoachScreen;