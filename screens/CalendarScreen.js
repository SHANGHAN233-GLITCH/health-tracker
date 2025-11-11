import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Title, Paragraph, IconButton, Badge, List } from 'react-native-paper';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function: Get icon for meal type
const getMealTypeIcon = (mealType) => {
  const iconMap = {
    breakfast: 'bowl',
    lunch: 'sandwich',
    dinner: 'food',
    snack: 'cup-soda'
  };
  return iconMap[mealType] || 'food';
};

// Helper function: Get display name for meal type
const getMealTypeDisplayName = (mealType) => {
  const nameMap = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack'
  };
  return nameMap[mealType] || mealType;
};

const CalendarScreen = ({ navigation }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [mealsForSelectedDate, setMealsForSelectedDate] = useState([]);
  const [caloriesForSelectedDate, setCaloriesForSelectedDate] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  // Function to generate calendar days
  const generateCalendarDays = () => {
    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Add days from previous month to fill first week
    const firstDayOfMonth = startDate.getDay();
    const prevMonthDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() - (firstDayOfMonth - i));
      prevMonthDays.push({
        date: day,
        isCurrentMonth: false,
      });
    }

    // Add current month days
    const currentMonthDays = days.map(day => ({
      date: day,
      isCurrentMonth: true,
      isToday: isSameDay(day, new Date()),
      calories: 1700 + Math.floor(Math.random() * 500),
    }));

    // Combine days and calculate total days needed to fill calendar grid
    const allDays = [...prevMonthDays, ...currentMonthDays];
    const totalDays = allDays.length;
    const daysToAdd = 42 - totalDays; // 6 weeks * 7 days

    // Add days from next month if needed
    for (let i = 1; i <= daysToAdd; i++) {
      const day = new Date(endDate);
      day.setDate(endDate.getDate() + i);
      allDays.push({
        date: day,
        isCurrentMonth: false,
      });
    }

    setCalendarDays(allDays);
  };

  // Reload meal data for selected date
  const reloadMeals = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const mealsJson = await AsyncStorage.getItem('meals');
      const allMeals = mealsJson ? JSON.parse(mealsJson) : [];
      
      // Filter meals for selected date and format for UI
      const mealsForDate = allMeals
        .filter(meal => meal.date === dateStr)
        .map(meal => ({
          id: meal.id,
          name: meal.foodName,
          category: getMealTypeDisplayName(meal.type),
          calories: meal.calories,
          time: meal.time,
          icon: getMealTypeIcon(meal.type)
        }));
      
      setMealsForSelectedDate(mealsForDate);
      setCaloriesForSelectedDate(mealsForDate.reduce((sum, meal) => sum + meal.calories, 0));
    } catch (error) {
      console.error('Error loading meals for selected date:', error);
      setMealsForSelectedDate([]);
      setCaloriesForSelectedDate(0);
    }
  };

  useEffect(() => {
    generateCalendarDays();
    reloadMeals();
  }, [currentMonth, selectedDate]);

  // Listen for page focus changes, reload data when user returns from AddMeal page
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      reloadMeals();
    });
    
    return unsubscribe;
  }, [navigation, selectedDate]);

  const handleDateSelect = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day.date);
    }
  };

  const navigateToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const navigateToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const addNewMeal = () => {
    navigation.navigate('AddMeal', { date: selectedDate });
  };

  const handleDeleteMeal = async (mealId) => {
    try {
      // Get all meals
      const mealsJson = await AsyncStorage.getItem('meals');
      let allMeals = mealsJson ? JSON.parse(mealsJson) : [];
      
      // Delete meal with specified ID
      allMeals = allMeals.filter(meal => meal.id !== mealId);
      
      // Save back to AsyncStorage
      await AsyncStorage.setItem('meals', JSON.stringify(allMeals));
      
      // Reload meals for current date
      reloadMeals();
      
      console.log('Meal deleted successfully');
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Month header */}
      <View style={styles.monthHeader}>
        <IconButton
          icon="chevron-left"
          size={24}
          onPress={navigateToPreviousMonth}
        />
        <Title style={styles.monthTitle}>
          {format(currentMonth, 'MMMM yyyy')}
        </Title>
        <IconButton
          icon="chevron-right"
          size={24}
          onPress={navigateToNextMonth}
        />
      </View>

      {/* Week days header */}
      <View style={styles.weekDaysHeader}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={[styles.calendarGrid, { maxWidth: screenWidth }]}>
        {calendarDays.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.calendarDay, {
              opacity: day.isCurrentMonth ? 1 : 0.4,
              backgroundColor: isSameDay(day.date, selectedDate) ? '#e8f5e9' : 'transparent',
              borderColor: isSameDay(day.date, selectedDate) ? '#4CAF50' : 'transparent',
            }]}
            onPress={() => handleDateSelect(day)}
          >
            <View>
              <Text style={[styles.dayNumber, {
                fontWeight: day.isToday ? 'bold' : 'normal',
                color: day.isToday ? '#4CAF50' : '#333',
              }]}>
                {format(day.date, 'd')}
              </Text>
              {day.isCurrentMonth && day.calories && (
                <Text style={styles.dayCalories}>{day.calories}k</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected date summary */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryHeader}>
            <Title style={styles.summaryTitle}>
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </Title>
            <IconButton
              icon="plus"
              size={24}
              color="#4CAF50"
              onPress={addNewMeal}
            />
          </View>

          <Badge style={styles.caloriesBadge}>
            Total: {caloriesForSelectedDate} kcal
          </Badge>
        </Card.Content>
      </Card>

      {/* Meals list */}
      <View style={styles.mealsContainer}>
        <Title style={styles.mealsTitle}>Meals</Title>

        {mealsForSelectedDate.length > 0 ? (
          mealsForSelectedDate.map(meal => (
            <List.Item
              key={meal.id}
              title={meal.name}
              description={`${meal.category} • ${meal.time}`}
              left={props => <List.Icon {...props} icon={meal.icon} color="#4CAF50" />}
              right={() => (
                <View style={styles.mealActions}>
                  <Badge style={styles.mealBadge}>{meal.calories} kcal</Badge>
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor="#f44336"
                    onPress={() => handleDeleteMeal(meal.id)}
                    style={styles.deleteButton}
                  />
                </View>
              )}
              style={styles.mealItem}
            />
          ))
        ) : (
          <Paragraph style={styles.noMealsText}>
            No meals recorded for this day. Add your first meal!
          </Paragraph>
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
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
  },
  monthTitle: {
    fontSize: 18,
    color: '#333',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  weekDayText: {
    fontWeight: 'bold',
    color: '#666',
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  calendarDay: {
    width: 45,
    height: 60,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
  },
  dayNumber: {
    fontSize: 16,
  },
  dayCalories: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  summaryCard: {
    margin: 15,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 18,
    color: '#333',
  },
  caloriesBadge: {
    backgroundColor: '#e8f5e9',
    color: '#4CAF50',
    padding: 5,
    fontSize: 14,
  },
  mealsContainer: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  mealsTitle: {
    fontSize: 20,
    marginBottom: 15,
    color: '#333',
  },
  mealItem: {
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 8,
  },
  mealActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealBadge: {
    backgroundColor: '#f1f8e9',
    color: '#4CAF50',
    marginRight: 5,
  },
  deleteButton: {
    margin: 0,
    padding: 0,
    minWidth: 0,
  },
  noMealsText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
});

export default CalendarScreen;