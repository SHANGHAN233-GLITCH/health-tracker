# Health Tracker App

健康追踪应用 - 一个使用 Expo 和 React Native 构建的跨平台健康管理应用。

## 功能特性

- 用户配置文件管理
- 饮食记录和追踪
- 健康数据分析和统计
- AI 健康助手
- 多语言支持

## 技术栈

- Expo SDK 54
- React Native
- React Navigation
- React Native Paper
- Reanimated
- i18next (国际化)

## 开发环境设置

1. 克隆仓库
```bash
git clone [仓库URL]
cd health-tracker
```

2. 安装依赖
```bash
npm install
```

3. 运行项目
```bash
# 启动开发服务器
npm start

# 在不同平台运行
npm run ios      # iOS模拟器
npm run android  # Android模拟器
npm run web      # Web浏览器
```

## 构建 Web 版本

```bash
node build-web.js
```

构建后的文件将位于 `dist` 目录，可以部署到 Vercel 等平台。

## 部署到 Vercel

1. 将项目推送到 GitHub
2. 在 Vercel 创建新项目并连接 GitHub 仓库
3. 配置构建命令：`node build-web.js`
4. 配置输出目录：`dist`
5. 部署并等待完成

## 许可证

MIT