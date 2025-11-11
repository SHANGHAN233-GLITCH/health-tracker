import React from 'react';
import { Platform } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

// 平台兼容的图表组件，修复Web平台的transform-origin问题
const PlatformChart = ({ ...props }) => {
  if (Platform.OS === 'web') {
    // Web平台上应用兼容性处理
    // 通过设置样式来覆盖可能的transform-origin属性
    const webProps = {
      ...props,
      chartConfig: {
        ...props.chartConfig,
        // 确保所有样式都是camelCase格式
      },
      style: {
        ...props.style,
        // 添加Web特定的兼容样式
        transformOrigin: 'top left', // 使用正确的React属性名
      },
    };
    
    return <BarChart {...webProps} />;
  }
  
  // 原生平台直接使用原始组件
  return <BarChart {...props} />;
};

export default PlatformChart;
