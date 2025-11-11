# 替代Netlify的图标正常显示部署方案

本指南提供了除Netlify外的多种部署选项，确保@expo/vector-icons图标能在Web平台上正常显示。

## 1. GitHub Pages

GitHub Pages是最简单且免费的托管选项，非常适合前端应用部署。

### 部署步骤：

1. **确保构建正确**
   ```bash
   node build-web.js
   ```

2. **安装gh-pages包**
   ```bash
   npm install -g gh-pages
   ```

3. **部署到GitHub Pages**
   ```bash
   gh-pages -d dist
   ```

4. **完成后访问**
   您的应用将在 `https://[username].github.io/[repository-name]` 可用

## 2. Vercel

Vercel是专为前端应用优化的托管平台，提供自动部署和预览功能。

### 部署步骤：

1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录Vercel**
   ```bash
   vercel login
   ```

3. **运行构建**
   ```bash
   node build-web.js
   ```

4. **部署到Vercel**
   ```bash
   vercel --prod
   ```

5. **按照提示完成配置**
   - 根目录选择：`dist`
   - 不需要构建命令，因为我们已经构建好了

## 3. Cloudflare Pages

Cloudflare Pages提供全球CDN加速，性能优秀且有免费计划。

### 部署步骤：

1. **通过Web界面部署**
   - 访问 [Cloudflare Pages](https://pages.cloudflare.com/)
   - 登录并选择您的GitHub仓库
   - 设置构建配置：
     - 构建命令：`node build-web.js`
     - 构建输出目录：`dist`
     - 环境：`Node.js`

2. **部署完成后**
   您将获得一个 `.pages.dev` 域名的网站

## 4. Firebase Hosting

Firebase Hosting提供可靠的托管服务，适合需要与其他Firebase服务集成的应用。

### 部署步骤：

1. **安装Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **登录Firebase**
   ```bash
   firebase login
   ```

3. **初始化Firebase项目**
   ```bash
   firebase init hosting
   ```
   - 选择或创建项目
   - 构建目录：`dist`

4. **运行构建**
   ```bash
   node build-web.js
   ```

5. **部署到Firebase**
   ```bash
   firebase deploy --only hosting
   ```

## 5. Surge.sh

Surge是最简单的静态网站托管服务之一，只需一行命令即可部署。

### 部署步骤：

1. **安装Surge CLI**
   ```bash
   npm install -g surge
   ```

2. **运行构建**
   ```bash
   node build-web.js
   ```

3. **部署到Surge**
   ```bash
   surge dist
   ```

4. **注册账号并设置域名**
   首次使用需要简单注册，然后可以自定义域名

## 确保图标正确显示的关键配置

无论选择哪种部署方式，请确保：

1. **metro.config.js 已正确配置**（我们已创建）
   ```javascript
   const { getDefaultConfig } = require('expo/metro-config');
   
   const config = getDefaultConfig(__dirname);
   config.resolver.assetExts.push('ttf', 'otf');
   config.resolver.platforms = ['ios', 'android', 'web'];
   
   module.exports = config;
   ```

2. **babel.config.js 已正确配置**（我们已创建）
   ```javascript
   module.exports = function(api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       plugins: [
         'react-native-reanimated/plugin',
       ],
     };
   };
   ```

3. **app.json 已正确配置**（我们已更新）

4. **build-web.js 包含字体路径处理**（我们已添加）

## 部署前检查清单

- [x] 运行 `node build-web.js` 确保构建成功
- [x] 检查 `dist` 目录中是否包含 `assets` 文件夹和字体文件
- [x] 确认 `index.html` 中的路径都是相对路径（以 `./` 开头）
- [x] 清除浏览器缓存后再访问部署的网站

## 故障排除

如果在其他平台仍遇到图标显示问题：

1. **验证字体文件路径**
   检查浏览器控制台是否有字体文件404错误

2. **查看网络请求**
   确认MaterialCommunityIcons.ttf字体文件是否成功加载

3. **尝试不同的托管服务**
   不同平台的配置略有差异，某些平台可能对字体文件的处理更友好

4. **考虑使用CDN托管字体**
   可以尝试将字体文件上传到CDN，然后修改引用路径