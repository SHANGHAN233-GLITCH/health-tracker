import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Title, IconButton, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, subDays, startOfDay } from 'date-fns';
import PlatformChart from '../src/components/PlatformChart';
import NutritionCalculator from '../services/NutritionCalculator';

const screenWidth = Dimensions.get('window').width;

const StatisticsScreen = ({ navigation }) => {
  const [dataType, setDataType] = useState('weight');
  const [dateRange, setDateRange] = useState('week');
  const [weightData, setWeightData] = useState([]);
  const [calorieData, setCalorieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState('');
  const [newCalories, setNewCalories] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load weight data
      const savedWeightData = await AsyncStorage.getItem('weightData');
      if (savedWeightData) {
        setWeightData(JSON.parse(savedWeightData));
      }

      // Load calorie data
      const savedCalorieData = await AsyncStorage.getItem('calorieData');
      if (savedCalorieData) {
        setCalorieData(JSON.parse(savedCalorieData));
      }
    } catch (error) {
      console.error('Error loading statistics data:', error);
      Alert.alert('Error', 'Failed to load statistics data');
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('weightData', JSON.stringify(weightData));
      await AsyncStorage.setItem('calorieData', JSON.stringify(calorieData));
    } catch (error) {
      console.error('Error saving statistics data:', error);
      Alert.alert('Error', 'Failed to save statistics data');
    }
  };

  const addRecord = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    try {
      if (dataType === 'weight') {
        const weightNum = parseFloat(newWeight);
        if (isNaN(weightNum) || weightNum <= 0) {
          Alert.alert('Invalid Input', 'Please enter a valid weight');
          return;
        }

        const updatedData = [...weightData];
        const existingIndex = updatedData.findIndex(item => item.date === today);
        
        if (existingIndex >= 0) {
          updatedData[existingIndex] = { date: today, value: weightNum };
        } else {
          updatedData.push({ date: today, value: weightNum });
        }
        
        setWeightData(updatedData);
        
        // 同步体重数据到用户资料
        try {
          const userProfile = await AsyncStorage.getItem('userProfile');
          if (userProfile) {
            const profileData = JSON.parse(userProfile);
            profileData.weight = weightNum.toString();
            profileData.lastUpdated = new Date().toISOString();
            await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
            
            // 重新计算并更新目标卡路里
            const nutritionData = NutritionCalculator.getDailyNutrition(profileData);
            if (nutritionData && nutritionData.targetCalories) {
              await AsyncStorage.setItem('calorieTarget', nutritionData.targetCalories.toString());
            }
          }
        } catch (error) {
          console.error('Error updating user profile with new weight:', error);
        }
        
        Alert.alert('Success', 'Weight recorded successfully and synced with profile');
      } else {
        const caloriesNum = parseInt(newCalories);
        if (isNaN(caloriesNum) || caloriesNum < 0) {
          Alert.alert('Invalid Input', 'Please enter a valid calorie amount');
          return;
        }

        const updatedData = [...calorieData];
        const existingIndex = updatedData.findIndex(item => item.date === today);
        
        if (existingIndex >= 0) {
          updatedData[existingIndex] = { date: today, value: caloriesNum };
        } else {
          updatedData.push({ date: today, value: caloriesNum });
        }
        
        setCalorieData(updatedData);
        Alert.alert('Success', 'Calories recorded successfully');
      }

      // Clear inputs and hide form
      setNewWeight('');
      setNewCalories('');
      setShowAddForm(false);
      
      // Save updated data
      await saveData();
    } catch (error) {
      console.error('Error adding record:', error);
      Alert.alert('Error', 'Failed to add record');
    }
  };

  const generateChartData = () => {
    const daysToShow = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 7;
    const dates = [];
    const values = [];
    const dataSource = dataType === 'weight' ? weightData : calorieData;
    
    // Generate date labels
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'MM/dd');
      const fullDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dates.push(date);
      
      // Find value for this date
      const record = dataSource.find(item => item.date === fullDate);
      values.push(record ? record.value : null);
    }

    // Filter out null values for valid min/max calculation
    const validValues = values.filter(v => v !== null);
    const minValue = validValues.length > 0 ? Math.min(...validValues) * 0.95 : 0;
    const maxValue = validValues.length > 0 ? Math.max(...validValues) * 1.05 : 100;

    return {
      labels: dates,
      datasets: [
        {
          data: values.map(v => v !== null ? v : 0),
          color: () => dataType === 'weight' ? '#4CAF50' : '#2196F3',
          barPercentage: 0.7
        }
      ],
      legend: [dataType === 'weight' ? 'Weight (kg)' : 'Calories'],
      yAxisLabel: '',
      yAxisSuffix: dataType === 'weight' ? ' kg' : '',
      yAxisInterval: 1,
      chartConfig: {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: dataType === 'weight' ? 1 : 0,
        color: () => dataType === 'weight' ? '#4CAF50' : '#2196F3',
        labelColor: () => '#666666',
        style: {
          borderRadius: 16
        },
        propsForDots: {
          r: '6',
          strokeWidth: '2',
          stroke: dataType === 'weight' ? '#4CAF50' : '#2196F3'
        }
      },
      bezier: false,
      style: {
        marginVertical: 8,
        borderRadius: 16
      }
    };
  };

  const getStatisticsSummary = () => {
    const dataSource = dataType === 'weight' ? weightData : calorieData;
    const daysToShow = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 7;
    
    // Filter data for the selected date range
    const cutoffDate = format(subDays(new Date(), daysToShow), 'yyyy-MM-dd');
    const recentData = dataSource
      .filter(item => item.date >= cutoffDate)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (recentData.length === 0) {
      return {
        average: 0,
        latest: 0,
        change: 0,
        hasData: false
      };
    }

    const sum = recentData.reduce((acc, item) => acc + item.value, 0);
    const average = sum / recentData.length;
    const latest = recentData[recentData.length - 1].value;
    
    // Calculate change (latest vs. first)
    const first = recentData[0].value;
    const change = latest - first;

    return {
      average: average,
      latest: latest,
      change: change,
      hasData: true
    };
  };

  const stats = getStatisticsSummary();
  const chartData = generateChartData();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Title style={styles.headerTitle}>Statistics</Title>
          <IconButton
            icon="plus-circle"
            size={24}
            onPress={() => setShowAddForm(!showAddForm)}
          />
        </View>

        {/* Data Type and Date Range Selector */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.segmentContainer}>
              <SegmentedButtons
                value={dataType}
                onValueChange={setDataType}
                buttons={[
                  { value: 'weight', label: 'Weight' },
                  { value: 'calories', label: 'Calories' }
                ]}
                style={styles.segmentButtons}
              />
              
              <SegmentedButtons
                value={dateRange}
                onValueChange={setDateRange}
                buttons={[
                  { value: 'week', label: 'Week' },
                  { value: 'month', label: 'Month' }
                ]}
                style={styles.segmentButtons}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Add Record Form */}
        {showAddForm && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.formTitle}>Add New {dataType === 'weight' ? 'Weight' : 'Calories'} Record</Title>
              
              <TextInput
                label={dataType === 'weight' ? 'Weight (kg)' : 'Calories Consumed'}
                value={dataType === 'weight' ? newWeight : newCalories}
                onChangeText={dataType === 'weight' ? setNewWeight : setNewCalories}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />
              
              <View style={styles.formActions}>
                <Button
                  mode="contained"
                  onPress={addRecord}
                  style={[styles.button, styles.saveButton]}
                >
                  Save
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowAddForm(false);
                    setNewWeight('');
                    setNewCalories('');
                  }}
                  style={[styles.button, styles.cancelButton]}
                >
                  Cancel
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Statistics Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Summary</Title>
            
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Average</Text>
                <Text style={styles.summaryValue}>
                  {stats.hasData ? (dataType === 'weight' ? stats.average.toFixed(1) : Math.round(stats.average)) : 'N/A'}
                  {dataType === 'weight' ? ' kg' : ' cal'}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Latest</Text>
                <Text style={styles.summaryValue}>
                  {stats.hasData ? (dataType === 'weight' ? stats.latest.toFixed(1) : stats.latest) : 'N/A'}
                  {dataType === 'weight' ? ' kg' : ' cal'}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Change</Text>
                <Text style={[styles.summaryValue, stats.change > 0 ? styles.positiveChange : stats.change < 0 ? styles.negativeChange : {}]}>
                  {stats.hasData ? (stats.change > 0 ? '+' : '') + (dataType === 'weight' ? stats.change.toFixed(1) : stats.change) : 'N/A'}
                  {dataType === 'weight' ? ' kg' : ' cal'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Chart */}
        {stats.hasData ? (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.chartTitle}>{dataType === 'weight' ? 'Weight Trend' : 'Calorie Intake Trend'} ({dateRange === 'week' ? 'Last 7 Days' : 'Last 30 Days'})</Title>
              <PlatformChart
                data={chartData}
                width={screenWidth - 60}
                height={220}
                yAxisSuffix={chartData.yAxisSuffix}
                chartConfig={chartData.chartConfig}
                bezier={chartData.bezier}
                style={chartData.style}
                withInnerLines={true}
                withOuterLines={true}
                fromZero={false}
                showValuesOnTopOfBars={true}
                withLabels={true}
                useShadow={false}
              />
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Card.Content style={styles.emptyState}>
              <MaterialCommunityIcons name="chart-bar" size={60} color="#ccc" />
              <Title style={styles.emptyTitle}>No Data Available</Title>
              <Text style={styles.emptyText}>
                Start recording your {dataType === 'weight' ? 'weight' : 'calorie intake'} to see trends here.
              </Text>
              <Button
                mode="contained"
                onPress={() => setShowAddForm(true)}
                style={styles.emptyButton}
              >
                Add First Record
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Tips Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.tipsTitle}>Tips</Title>
            <Text style={styles.tipsText}>
              {dataType === 'weight' ? (
                '• Track your weight at the same time each day for consistency\n'
                + '• Weekly averages give a better picture than daily fluctuations\n'
                + '• Weight can fluctuate by 0.5-1kg daily due to hydration and food'
              ) : (
                '• Track your calories daily to maintain awareness\n'
                + '• Compare actual intake with your target for better results\n'
                + '• Consistent recording helps identify patterns in your eating habits'
              )}
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    margin: 15,
    elevation: 2,
  },
  segmentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  segmentButtons: {
    flex: 1,
    marginHorizontal: 5,
  },
  formTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    borderColor: '#4CAF50',
  },
  summaryTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 5,
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  positiveChange: {
    color: '#4CAF50',
  },
  negativeChange: {
    color: '#f44336',
  },
  chartTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 15,
    marginBottom: 10,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
  },
  tipsTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
});

export default StatisticsScreen;