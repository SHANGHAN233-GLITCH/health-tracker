import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, Title, Paragraph, Button, IconButton, Avatar, Badge, TextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Mock data for calendar
const generateCalendarDays = () => {
  const days = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Add some days from previous month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }

  // Add current month days
  for (let i = 1; i <= daysInMonth; i++) {
    // Mock calorie data
    const calories = 1700 + Math.floor(Math.random() * 500);
    days.push({
      day: i,
      date: new Date(currentYear, currentMonth, i),
      calories,
      isToday: i === today.getDate(),
    });
  }

  return days;
};

// Mock meal data
const mockMeals = [
    {
      id: 1,
      name: 'Oatmeal',
      category: 'Breakfast',
      calories: 350,
      time: '08:00',
      icon: 'bowl',
    },
    {
      id: 2,
      name: 'Grilled Chicken Salad',
      category: 'Lunch',
      calories: 450,
      time: '12:30',
      icon: 'silverware-fork-knife',
    },
    {
      id: 3,
      name: 'Steak with Vegetables',
      category: 'Dinner',
      calories: 550,
      time: '19:00',
      icon: 'food-steak',
    },
  ];

  // Common quick foods


// Mock recipe data for recommendations
const mockRecipes = [
  {
    id: 1,
    name: 'Vegetable Omelet',
    calories: 320,
    prepTime: '15 mins',
    category: 'Breakfast',
    ingredients: ['Eggs', 'Spinach', 'Bell Pepper', 'Onion', 'Mushrooms'],
    icon: 'food-fork-drink',
    instructions: '1. Beat eggs and set aside.\n2. Heat oil in a pan, sauté onion and mushrooms until fragrant.\n3. Add spinach and bell pepper, stir-fry until soft.\n4. Pour in egg mixture and cook on low heat until bottom sets.\n5. Fold the omelet and continue cooking until fully done.\n6. Cut into pieces and serve.'
  },
  {
    id: 2,
    name: 'Quinoa Avocado Bowl',
    calories: 420,
    prepTime: '20 mins',
    category: 'Lunch',
    ingredients: ['Quinoa', 'Avocado', 'Cherry Tomatoes', 'Cucumber', 'Feta Cheese'],
    icon: 'bowl',
    instructions: '1. Cook quinoa according to package instructions until done.\n2. Dice avocado, halve cherry tomatoes, and slice cucumber.\n3. Place cooked quinoa in a bowl, add prepared vegetables.\n4. Sprinkle with feta cheese crumbles.\n5. Add olive oil and lemon juice to taste.'
  },
  {
    id: 3,
    name: 'Baked Salmon with Asparagus',
    calories: 450,
    prepTime: '25 mins',
    category: 'Dinner',
    ingredients: ['Salmon Fillet', 'Asparagus', 'Lemon', 'Olive Oil', 'Garlic'],
    icon: 'food-fish',
    instructions: '1. Preheat oven to 200°C.\n2. Clean and pat dry the salmon, season with salt and black pepper.\n3. Wash asparagus and trim tough ends.\n4. Line a baking tray with foil, place salmon and asparagus on it.\n5. Drizzle with olive oil and sprinkle with chopped garlic.\n6. Squeeze fresh lemon juice over.\n7. Bake for 15-20 minutes until salmon is cooked and asparagus is tender.'
  },
  {
    id: 4,
    name: 'Greek Yogurt with Berries',
    calories: 220,
    prepTime: '5 mins',
    category: 'Snack',
    ingredients: ['Greek Yogurt', 'Mixed Berries', 'Honey', 'Granola'],
    icon: 'yogurt',
    instructions: '1. Pour Greek yogurt into a bowl.\n2. Top with washed mixed berries.\n3. Drizzle with honey.\n4. Sprinkle granola for added texture.\n5. Gently mix and serve.'
  },
  {
    id: 5,
    name: 'Turkey Wrap',
    calories: 380,
    prepTime: '10 mins',
    category: 'Lunch',
    ingredients: ['Whole Wheat Tortilla', 'Turkey Breast', 'Lettuce', 'Tomato', 'Hummus'],
    icon: 'food-wrap',
    instructions: '1. Lay the tortilla flat on a surface.\n2. Spread an even layer of hummus.\n3. Place sliced turkey breast.\n4. Add lettuce leaves and tomato slices.\n5. Roll tightly from one end, ensuring all ingredients are enclosed.\n6. Cut diagonally into two pieces and serve.'
  },
  {
    id: 6,
    name: 'Stir-Fried Mixed Vegetables',
    calories: 350,
    prepTime: '15 mins',
    category: 'Dinner',
    ingredients: ['Broccoli', 'Carrots', 'Snow Peas', 'Bell Pepper', 'Soy Sauce'],
    icon: 'food-stew',
    instructions: '1. Wash and chop all vegetables into small pieces.\n2. Heat oil in a pan, stir-fry carrots until half-cooked.\n3. Add broccoli and stir-fry.\n4. Finally add snow peas and bell peppers.\n5. Season with soy sauce, stir-fry quickly until well combined.\n6. Serve while vegetables are still crisp-tender.'
  }
];

const DashboardScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todayCalories, setTodayCalories] = useState(1350);
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [remainingCalories, setRemainingCalories] = useState(650);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTargetInput, setShowTargetInput] = useState(false);
  const [tempTarget, setTempTarget] = useState(calorieTarget.toString());
  const [recommendedRecipes, setRecommendedRecipes] = useState([]);

  // Function to load user data
  const loadUserData = async () => {
    try {
      // Try to load from currentUser first (which contains registration data)
      const currentUserData = await AsyncStorage.getItem('currentUser');
      if (currentUserData) {
        setUserData(JSON.parse(currentUserData));
      } else {
        // Fallback to userData if currentUser is not available
        const data = await AsyncStorage.getItem('userData');
        if (data) {
          setUserData(JSON.parse(data));
        }
      }
      
      // Load user's calorie target
      loadCalorieTarget();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };
  
  // Function to load calorie target
  const loadCalorieTarget = async () => {
    try {
      const savedTarget = await AsyncStorage.getItem('calorieTarget');
      if (savedTarget) {
        const targetValue = parseInt(savedTarget);
        setCalorieTarget(targetValue);
        setTempTarget(savedTarget);
      }
    } catch (error) {
      console.error('Error loading calorie target:', error);
    }
  };
  
  // Save calorie target
  const saveCalorieTarget = async (target) => {
    try {
      const targetNum = parseInt(target);
      if (!isNaN(targetNum) && targetNum > 0) {
        setCalorieTarget(targetNum);
        await AsyncStorage.setItem('calorieTarget', targetNum.toString());
        setShowTargetInput(false);
      }
    } catch (error) {
      console.error('Error saving calorie target:', error);
    }
  };
  
  // Generate recipe recommendations
  const generateRecipeRecommendations = () => {
    const remainingCalories = Math.max(0, calorieTarget - todayCalories);
    
    // If user has consumed more than 80% of target calories, recommend low-calorie recipes
    if (todayCalories >= calorieTarget * 0.8) {
      const lowCalorieRecipes = mockRecipes.filter(recipe => recipe.calories <= 300);
      setRecommendedRecipes(lowCalorieRecipes.slice(0, 2));
    } 
    // Otherwise recommend recipes that help users reach their target
    else {
      // Find recipes with calories close to remaining needs
      const suitableRecipes = mockRecipes
        .filter(recipe => recipe.calories <= remainingCalories * 1.5) // Allow recipes to be 50% more than remaining calories
        .sort((a, b) => Math.abs(a.calories - remainingCalories) - Math.abs(b.calories - remainingCalories));
      
      setRecommendedRecipes(suitableRecipes.slice(0, 3));
    }
  };
  
  // Get health advice
  const getHealthAdvice = () => {
    const percentage = calculateCaloriePercentage();
    const now = new Date().getHours();
    
    if (percentage < 30 && now < 12) {
      return {
        title: 'Breakfast is Important',
        advice: 'It\'s morning time. Please have your breakfast to provide energy for the day. A balanced breakfast can help boost metabolism.',
        icon: 'food-apple'
      };
    } else if (percentage < 50) {
      return {
        title: 'Increase Nutrient Intake',
        advice: 'Your calorie intake is less than half of your daily goal. Consider increasing food intake while maintaining a balanced diet.',
        icon: 'arrow-up'
      };
    } else if (percentage >= 50 && percentage < 90) {
      return {
        title: 'Good Progress',
        advice: 'Your calorie intake is on track. Continue with a balanced diet and ensure food diversity.',
        icon: 'thumb-up'
      };
    } else if (percentage >= 90 && percentage <= 110) {
      return {
        title: 'Perfect Achievement',
        advice: 'Your calorie intake has reached or is close to your goal. Consider healthy low-calorie snacks or some exercise.',
        icon: 'check-circle'
      };
    } else {
      return {
        title: 'Slightly Over',
        advice: 'Your calorie intake has exceeded your daily goal today. Consider reducing intake tomorrow and increasing physical activity.',
        icon: 'information'
      };
    }
  };

  // Function to load meal data
  const reloadMeals = async () => {
    try {
      setLoading(true);
      // Load meal data from AsyncStorage
      const mealsJson = await AsyncStorage.getItem('meals');
      if (mealsJson) {
        const mealsData = JSON.parse(mealsJson);
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        // Filter meals for today
        const todayMeals = mealsData
          .filter(meal => meal.date === today)
          .map(meal => ({
            id: meal.id,
            name: meal.name || meal.foodName,
            // Use existing category if available, otherwise derive from type
            category: meal.category || (meal.type === 'breakfast' ? 'Breakfast' : 
                      meal.type === 'lunch' ? 'Lunch' :
                      meal.type === 'dinner' ? 'Dinner' : 'Snack'),
            calories: meal.calories,
            time: meal.time ? (typeof meal.time === 'string' && meal.time.includes('T') ? new Date(meal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : meal.time) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            // Use existing icon if available, otherwise set based on meal type or category
            icon: meal.icon || (meal.type ? 
                  (meal.type === 'breakfast' ? 'bowl' : 
                   meal.type === 'lunch' ? 'silverware-fork-knife' :
                   meal.type === 'dinner' ? 'food-steak' : 'coffee') :
                  (meal.category && meal.category.toLowerCase() === 'breakfast' ? 'coffee' :
                   meal.category && meal.category.toLowerCase() === 'lunch' ? 'silverware-fork-knife' :
                   meal.category && meal.category.toLowerCase() === 'dinner' ? 'food-steak' : 'food-apple')
            )
          }));
        
        setMeals(todayMeals);
        
        // Calculate total calories for today
        const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
        setTodayCalories(totalCalories);
      } else {
        // If no data, use mock data as default
        setMeals(mockMeals);
      }
    } catch (error) {
      console.error('Error loading meals:', error);
      // Use mock data in case of error
      setMeals(mockMeals);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCalendarDays(generateCalendarDays());
    loadUserData();
    reloadMeals();
  }, []);
  
  // Listen for page focus changes and reload data when returning to dashboard
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCalorieTarget(); // Load latest target when returning to dashboard
      reloadMeals(); // Reload meals data to show any new meals added
    });
    
    return unsubscribe;
  }, [navigation, reloadMeals, loadCalorieTarget]);
  
  // Set up interval to check for target updates every 5 seconds
  useEffect(() => {
    const intervalId = setInterval(loadCalorieTarget, 5000);
    return () => clearInterval(intervalId);
  }, []);
  
  // Update recommended recipes and remaining calories when today's calories or target calories change
  useEffect(() => {
    // Calculate remaining calories first
    const remaining = calorieTarget - todayCalories;
    setRemainingCalories(remaining > 0 ? remaining : 0);
    
    // Then generate recipe recommendations
    generateRecipeRecommendations();
  }, [todayCalories, calorieTarget]);






  // Function to delete meal
  const handleDeleteMeal = async (mealId) => {
    try {
      // Get existing meal data
      let existingMealsJson = await AsyncStorage.getItem('meals');
      if (existingMealsJson) {
        let existingMeals = JSON.parse(existingMealsJson);
        
        // Filter out the meal to be deleted
        const updatedMeals = existingMeals.filter(meal => meal.id !== mealId);
        
        // Save updated meal data
        await AsyncStorage.setItem('meals', JSON.stringify(updatedMeals));
        
        // Reload data
        reloadMeals();
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  // AI nutrition calculation function (mock implementation)
  const calculateNutrition = (foodName, portionSize = 100) => {
    // Mock AI calculation - in a real app, this would call an API
    const foodDatabase = {
      'apple': { calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, water: 86 },
      'banana': { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, water: 75 },
      'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, water: 65 },
      'salad': { calories: 15, protein: 1, carbs: 3, fat: 0.1, fiber: 1.2, water: 95 },
      'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, water: 70 },
      'pasta': { calories: 131, protein: 5.1, carbs: 25.6, fat: 0.8, fiber: 1.3, water: 72 },
      'eggs': { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, water: 76 },
      'milk': { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, water: 90 },
      'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, water: 37 },
      'cheese': { calories: 402, protein: 25, carbs: 1.3, fat: 33, fiber: 0, water: 37 }
    };

    // Find closest match in database
    const normalizedFoodName = foodName.toLowerCase();
    let bestMatch = null;
    let bestMatchScore = 0;

    Object.keys(foodDatabase).forEach(food => {
      if (normalizedFoodName.includes(food)) {
        const score = food.length / normalizedFoodName.length;
        if (score > bestMatchScore) {
          bestMatchScore = score;
          bestMatch = food;
        }
      }
    });

    // If a match is found, adjust values based on portion size
    if (bestMatch) {
      const nutrition = foodDatabase[bestMatch];
      const ratio = portionSize / 100;
      return {
        calories: Math.round(nutrition.calories * ratio),
        protein: Math.round(nutrition.protein * ratio * 10) / 10,
        carbs: Math.round(nutrition.carbs * ratio * 10) / 10,
        fat: Math.round(nutrition.fat * ratio * 10) / 10,
        fiber: Math.round(nutrition.fiber * ratio * 10) / 10,
        water: Math.round(nutrition.water * ratio * 10) / 10,
        foodName: foodName
      };
    }

    // Default values if no match found
    return {
      calories: Math.floor(Math.random() * 200) + 50, // Random calories between 50-250
      protein: Math.round(Math.random() * 20 * 10) / 10,
      carbs: Math.round(Math.random() * 30 * 10) / 10,
      fat: Math.round(Math.random() * 15 * 10) / 10,
      fiber: Math.round(Math.random() * 5 * 10) / 10,
      water: Math.round(Math.random() * 90 + 5),
      foodName: foodName,
      estimated: true
    };
  };

  // States for add meal modal
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [portionSize, setPortionSize] = useState('100');
  const [mealCategory, setMealCategory] = useState('Breakfast');
  const [nutritionInfo, setNutritionInfo] = useState(null);
  const [calculatingNutrition, setCalculatingNutrition] = useState(false);
  const [mealTime, setMealTime] = useState(format(new Date(), 'HH:mm'));

  // Calculate nutrition when food name or portion size changes
  useEffect(() => {
    if (foodName.trim()) {
      const timer = setTimeout(() => {
        calculateNutritionForFood();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [foodName, portionSize]);

  // Calculate nutrition for the entered food
  const calculateNutritionForFood = () => {
    if (!foodName.trim()) return;
    
    setCalculatingNutrition(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const nutrition = calculateNutrition(foodName, parseInt(portionSize) || 100);
      setNutritionInfo(nutrition);
      setCalculatingNutrition(false);
    }, 800);
  };

  // Add meal function
  const handleAddMeal = async () => {
    if (!foodName.trim() || !nutritionInfo) return;
    
    try {
      // Get existing meal data
      let existingMealsJson = await AsyncStorage.getItem('meals');
      let existingMeals = existingMealsJson ? JSON.parse(existingMealsJson) : [];
      
      // Generate unique ID
      const newId = Date.now();
      
      // Get appropriate icon based on category
      let icon = 'food-apple';
      switch (mealCategory.toLowerCase()) {
        case 'breakfast':
          icon = 'coffee';
          break;
        case 'lunch':
          icon = 'silverware-fork-knife';
          break;
        case 'dinner':
          icon = 'food-steak';
          break;
        case 'snack':
          icon = 'cookie';
          break;
      }
      
      // Get today's date in YYYY-MM-DD format
      const todayDate = new Date().toISOString().split('T')[0];
      
      // Create new meal object
      const newMeal = {
        id: newId,
        name: foodName.trim(),
        foodName: foodName.trim(), // For compatibility with existing code
        category: mealCategory,
        type: mealCategory.toLowerCase(), // For compatibility with existing code
        calories: nutritionInfo.calories,
        time: mealTime,
        date: todayDate,
        icon: icon,
        nutrition: nutritionInfo
      };
      
      // Add to existing meals
      const updatedMeals = [...existingMeals, newMeal];
      
      // Save updated meal data
      await AsyncStorage.setItem('meals', JSON.stringify(updatedMeals));
      
      // Reload data
      reloadMeals();
      
      // Close modal and reset form
      setShowAddMealModal(false);
      setFoodName('');
      setPortionSize('100');
      setMealCategory('Breakfast');
      setNutritionInfo(null);
      setMealTime(format(new Date(), 'HH:mm'));
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  };

  const calculateCaloriePercentage = () => {
    return Math.min((todayCalories / calorieTarget) * 100, 100);
  };
  
  // Get progress bar color based on calorie percentage
  const getProgressBarColor = () => {
    const percentage = calculateCaloriePercentage();
    if (percentage < 50) {
      return '#4CAF50'; // Green - below half
    } else if (percentage < 90) {
      return '#FF9800'; // Orange - critical point
    } else if (percentage <= 100) {
      return '#FFC107'; // Yellow - approaching target
    } else {
      return '#F44336'; // Red - exceeded
    }
  };
  
  // Get Badge style based on calorie percentage
  const getBadgeStyle = () => {
    const percentage = calculateCaloriePercentage();
    if (percentage < 50) {
      return { ...styles.calorieBadge, backgroundColor: '#E8F5E9' };
    } else if (percentage < 90) {
      return { ...styles.calorieBadge, backgroundColor: '#FFF3E0' };
    } else if (percentage <= 100) {
      return { ...styles.calorieBadge, backgroundColor: '#FFFDE7' };
    } else {
      return { ...styles.calorieBadge, backgroundColor: '#FFEBEE' };
    }
  };
  
  // Get Badge text color based on calorie percentage
  const getBadgeTextColor = () => {
    const percentage = calculateCaloriePercentage();
    if (percentage < 50) {
      return '#2E7D32'; // Dark green
    } else if (percentage < 90) {
      return '#E65100'; // Dark orange
    } else if (percentage <= 100) {
      return '#F57F17'; // Amber
    } else {
      return '#C62828'; // Dark red
    }
  };
  
  // Get progress feedback text
  const getProgressFeedback = () => {
    const percentage = calculateCaloriePercentage();
    if (percentage < 50) {
      return 'Keep going!';
    } else if (percentage < 90) {
      return 'Almost there!';
    } else if (percentage <= 100) {
      return 'Great job!';
    } else {
      return 'Watch your intake!';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Title style={styles.greeting}>Welcome {userData?.name || 'User'}</Title>
      <Paragraph style={styles.date}>{format(new Date(), 'MMMM d, yyyy EEEE')}</Paragraph>
        </View>
        <Avatar.Image
          source={{ uri: 'https://picsum.photos/200' }}
          size={50}
        />
      </View>

      {/* Today's Calories */}
      <Card style={styles.calorieCard}>
        <Card.Content>
          <View style={styles.calorieHeader}>
            <Title style={styles.cardTitle}>Today's Calories</Title>
            {showTargetInput ? (
              <View style={styles.targetInputContainer}>
                <TextInput
                  value={tempTarget}
                  onChangeText={setTempTarget}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.targetInput}
                  onSubmitEditing={() => saveCalorieTarget(tempTarget)}
                  placeholder="Set target"
                />
                <Button
                  mode="text"
                  onPress={() => saveCalorieTarget(tempTarget)}
                  style={styles.saveButton}
                >
                  Save
                </Button>
                <Button
                  mode="text"
                  onPress={() => {
                    setShowTargetInput(false);
                    setTempTarget(calorieTarget.toString());
                  }}
                >
                  Cancel
                </Button>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setShowTargetInput(true)}>
                  <Badge style={getBadgeStyle()}>
                    <Text style={{ color: getBadgeTextColor() }}>
                      {todayCalories}/{calorieTarget} kcal
                    </Text>
                  </Badge>
                </TouchableOpacity>
            )}
          </View>

          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar, 
                { 
                  width: `${calculateCaloriePercentage()}%`,
                  backgroundColor: getProgressBarColor(),
                  // Add dynamic change effect
                  height: calculateCaloriePercentage() > 100 ? 12 : '100%',
                  borderWidth: calculateCaloriePercentage() > 100 ? 1 : 0,
                  borderColor: '#F44336'
                } 
              ]}
            />
          </View>

          <View style={styles.feedbackContainer}>
            <Text style={[styles.progressText, { color: getBadgeTextColor() }]}>
              Completed {calculateCaloriePercentage().toFixed(0)}% · Remaining {remainingCalories} kcal
            </Text>
            <Text style={[styles.feedbackText, { color: getBadgeTextColor() }]}>
              {getProgressFeedback()}
            </Text>
          </View>
        </Card.Content>
      </Card>
      
      {/* Today's Advice */}
      <Card style={styles.adviceCard}>
        <Card.Content>
          <View style={styles.adviceHeader}>
            <IconButton
              icon={getHealthAdvice().icon}
              size={24}
              color="#4CAF50"
            />
            <View style={styles.adviceContent}>
              <Title style={styles.adviceTitle}>{getHealthAdvice().title}</Title>
              <Paragraph style={styles.adviceText}>{getHealthAdvice().advice}</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>
      


      {/* Recipe Recommendations */}
      {recommendedRecipes.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <Title style={styles.recommendationsTitle}>Recommended Recipes</Title>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recommendedRecipes.map(recipe => (
              <TouchableOpacity
                key={recipe.id}
                onPress={() => {
                  // Set recipe data in the meal addition modal
                  setFoodName(recipe.name);
                  setMealCategory(recipe.category);
                  setPortionSize('100');
                  
                  // Pre-calculate nutrition info based on the recipe calories
                  setNutritionInfo({
                    calories: recipe.calories,
                    protein: Math.round(recipe.calories * 0.25 / 4), // Estimate protein content
                    fat: Math.round(recipe.calories * 0.3 / 9), // Estimate fat content
                    carbs: Math.round(recipe.calories * 0.45 / 4), // Estimate carbs content
                    fiber: Math.round(Math.random() * 5 + 2), // Random fiber content
                    water: Math.round(Math.random() * 30 + 50), // Random water content
                    sugar: Math.round(Math.random() * 10)
                  });
                  
                  // Open the add meal modal
                  setShowAddMealModal(true);
                }}
              >
                <Card style={styles.recipeCard}>
                  <Card.Content>
                    <IconButton
                      icon={recipe.icon}
                      size={32}
                      color="#4CAF50"
                      style={styles.recipeIcon}
                    />
                    <Title style={styles.recipeName}>{recipe.name}</Title>
                    <Paragraph style={styles.recipeInfo}>{recipe.category}</Paragraph>
                    <Badge style={styles.recipeCalories}>{recipe.calories} kcal</Badge>
                    <Text style={styles.prepTime}>⏱ {recipe.prepTime}</Text>
                    <Text style={styles.tapHint}>Tap to add to your diet record</Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>

    {/* Add Meal Modal */}
    <Modal
      visible={showAddMealModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddMealModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Title style={styles.modalTitle}>Add New Food</Title>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setShowAddMealModal(false)}
            />
          </View>

          <ScrollView style={styles.modalScrollView}>
            {/* Food Name Input */}
            <TextInput
              label="Food Name"
              value={foodName}
              onChangeText={setFoodName}
              mode="outlined"
              style={styles.input}
              placeholder="Enter food name"
            />

            {/* Portion Size Input */}
            <TextInput
              label="Portion Size (g)"
              value={portionSize}
              onChangeText={setPortionSize}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              placeholder="100"
            />

            {/* Meal Category Selection */}
            <Title style={styles.sectionTitle}>Meal Category</Title>
            <View style={styles.categoryContainer}>
              {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    mealCategory === category && styles.categoryButtonSelected
                  ]}
                  onPress={() => setMealCategory(category)}
                >
                  <Text style={[
                    styles.categoryText,
                    mealCategory === category && styles.categoryTextSelected
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Meal Time Input */}
            <TextInput
              label="Meal Time"
              value={mealTime}
              onChangeText={setMealTime}
              mode="outlined"
              style={styles.input}
              placeholder="HH:MM"
            />

            {/* AI Nutrition Results */}
            {calculatingNutrition ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>AI is calculating nutrition...</Text>
              </View>
            ) : nutritionInfo && foodName.trim() ? (
              <Card style={styles.nutritionCard}>
                <Card.Content>
                  <Title style={styles.nutritionTitle}>
                    AI Nutrition Analysis for {nutritionInfo.foodName}
                    {nutritionInfo.estimated && ' (Estimated)'}
                  </Title>
                  <View style={styles.nutritionGrid}>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{nutritionInfo.calories}</Text>
                      <Text style={styles.nutritionLabel}>Calories</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{nutritionInfo.protein}g</Text>
                      <Text style={styles.nutritionLabel}>Protein</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{nutritionInfo.carbs}g</Text>
                      <Text style={styles.nutritionLabel}>Carbs</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{nutritionInfo.fat}g</Text>
                      <Text style={styles.nutritionLabel}>Fat</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{nutritionInfo.fiber}g</Text>
                      <Text style={styles.nutritionLabel}>Fiber</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{nutritionInfo.water}%</Text>
                      <Text style={styles.nutritionLabel}>Water</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ) : null}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowAddMealModal(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddMeal}
              disabled={!foodName.trim() || !nutritionInfo}
              style={styles.addButton}
            >
              Add Food
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
        </View>
      )}

      {/* Meals List */}
      <View style={styles.mealsContainer}>
        <View style={styles.mealsHeader}>
          <Title style={styles.cardTitle}>Today's Meals</Title>
          <IconButton
            icon="plus-circle"
            size={24}
            color="#4CAF50"
            onPress={() => setShowAddMealModal(true)}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : meals.length > 0 ? (
          meals.map(meal => (
            <Card key={meal.id} style={styles.mealCard}>
              <Card.Content style={styles.mealContent}>
                <IconButton
                  icon={meal.icon}
                  size={24}
                  color="#4CAF50"
                  style={styles.mealIcon}
                />
                <View style={styles.mealDetails}>
                  <Title style={styles.mealName}>{meal.name}</Title>
                  <Paragraph style={styles.mealCategory}>{meal.category} • {meal.time}</Paragraph>
                </View>
                <View style={styles.mealActions}>
                  <Badge style={styles.mealCalories}>{meal.calories} kcal</Badge>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteMeal(meal.id)}
                  >
                    <IconButton
                      icon="close-circle"
                      size={24}
                      color="#F44336"
                    />
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <IconButton
                icon="food-off"
                size={48}
                color="#ccc"
              />
              <Title style={styles.emptyTitle}>No meals added yet</Title>
                <Paragraph style={styles.emptyText}>No meals tracked for today</Paragraph>
            </Card.Content>
          </Card>
        )}
      </View>


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 15,
  },
  feedbackContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  greeting: {
    fontSize: 22,
    color: '#333',
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  calorieCard: {
    margin: 15,
    elevation: 2,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginVertical: 15,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  progressText: {
    textAlign: 'right',
    color: '#666',
    fontSize: 14,
  },
  calendarCard: {
    marginHorizontal: 15,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  calendarDayHeader: {
    fontWeight: 'bold',
    color: '#666',
    width: 35,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: 35,
    height: 55,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  todayDay: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  dayNumber: {
    fontWeight: 'bold',
    color: '#333',
  },
  dayCalories: {
    fontSize: 10,
    color: '#666',
  },
  mealsContainer: {
    margin: 15,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealCard: {
    marginBottom: 10,
    elevation: 2,
  },
  mealContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIcon: {
    marginRight: 10,
  },
  mealDetails: {
    flex: 1,
  },
  mealActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginLeft: 5,
  },
  mealName: {
    fontSize: 16,
    marginBottom: 2,
  },
  mealCategory: {
    color: '#666',
  },
  mealCalories: {
    backgroundColor: '#e8f5e9',
    color: '#4CAF50',
    fontSize: 14,
  },

  targetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetInput: {
    width: 100,
    height: 40,
    marginRight: 5,
  },
  saveButton: {
    marginLeft: 0,
  },
  adviceCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },

  adviceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    adviceContent: {
      flex: 1,
    },
    adviceTitle: {
      fontSize: 18,
      marginBottom: 5,
    },
    adviceText: {
      fontSize: 14,
      color: '#666',
    },
    recommendationsContainer: {
      marginBottom: 15,
    },
    recommendationsTitle: {
      marginLeft: 15,
      marginBottom: 10,
      fontSize: 20,
    },
    recipeCard: {
      width: 180,
      marginLeft: 15,
      elevation: 2,
    },
    recipeIcon: {
      alignSelf: 'center',
    },
    recipeName: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 5,
    },
    recipeInfo: {
      textAlign: 'center',
      color: '#666',
      fontSize: 14,
      marginBottom: 5,
    },
    recipeCalories: {
      alignSelf: 'center',
      backgroundColor: '#e8f5e9',
      color: '#4CAF50',
      marginBottom: 5,
    },
    prepTime: {
      textAlign: 'center',
      fontSize: 12,
      color: '#999',
    },
    tapHint: {
      textAlign: 'center',
      fontSize: 11,
      color: '#4CAF50',
      marginTop: 5,
      fontStyle: 'italic',
    },
    loadingContainer: {
      padding: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyCard: {
      marginVertical: 10,
      elevation: 2,
    },
    emptyContent: {
      alignItems: 'center',
      padding: 20,
    },
    emptyTitle: {
      marginVertical: 10,
      color: '#666',
    },
    emptyText: {
      textAlign: 'center',
      color: '#999',
    },
    cardTitle: {
      color: '#333',
    },
    // Add Meal Modal Styles
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
      fontSize: 20,
      color: '#333',
    },
    modalScrollView: {
      padding: 15,
    },
    input: {
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 18,
      marginBottom: 10,
      color: '#333',
    },
    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 15,
    },
    categoryButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: '#f0f0f0',
      marginRight: 10,
      marginBottom: 10,
    },
    categoryButtonSelected: {
      backgroundColor: '#4CAF50',
    },
    categoryText: {
      color: '#666',
      fontWeight: '500',
    },
    categoryTextSelected: {
      color: 'white',
    },
    nutritionCard: {
      marginTop: 10,
      marginBottom: 15,
    },
    nutritionTitle: {
      fontSize: 18,
      marginBottom: 15,
      color: '#333',
    },
    nutritionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    nutritionItem: {
      width: '33.33%',
      alignItems: 'center',
      marginBottom: 15,
    },
    nutritionValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#4CAF50',
      marginBottom: 5,
    },
    nutritionLabel: {
      fontSize: 14,
      color: '#666',
    },
    loadingText: {
      marginTop: 10,
      color: '#666',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 15,
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
    },
    cancelButton: {
      flex: 1,
      marginRight: 10,
    },
    addButton: {
      flex: 2,
    },
  });

export default DashboardScreen;