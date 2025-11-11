# GitHub Pages 部署指南

本指南提供了将health-tracker应用部署到GitHub Pages的详细步骤，解决了路径配置问题。

## 问题原因

Expo导出的web版本默认使用绝对路径（以`/`开头）引用资源文件，这在GitHub Pages子路径下会导致资源加载失败，从而显示空白页面。

## 一键构建解决方案

我已创建了一个自动化脚本，只需在项目根目录运行一次即可完成构建和路径修正：

```bash
# 确保在 health-tracker 目录中运行
node build-web.js
```

```bash
# 运行自动构建脚本
node build-web.js
```

该脚本会：
1. 执行`npx expo export --platform web`导出web版本
2. 自动修正`dist/index.html`中的所有路径，从绝对路径(`/`)改为相对路径(`./`)

## 手动部署步骤

### 1. 清理旧的构建文件

```bash
rm -rf dist
```

### 2. 构建web版本

```bash
node build-web.js
```

### 3. 创建GitHub仓库（如果还没有）

### 4. 配置Git（如果还没有）

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/your-repository.git
git push -u origin main
```

### 5. 部署到GitHub Pages

### 前置条件

1. **确保已安装Git**
   - 如果系统提示"git 无法识别"，请先安装Git
   - 下载地址：https://git-scm.com/downloads
   - 安装完成后，重启命令行工具
   - 验证安装：运行 `git --version`

2. **确保已初始化Git仓库并关联GitHub**
   ```bash
   # 如果尚未初始化Git仓库
   git init
   
   # 添加远程仓库（替换为您的GitHub仓库URL）
   git remote add origin https://github.com/your-username/health-tracker.git
   ```

有三种方式部署到GitHub Pages：

#### 方式C：手动部署（无需Git命令，当前推荐）

如果您的系统尚未安装Git，或者不想使用命令行，这是最直接的部署方法：

**详细上传步骤：**
1. 访问您的GitHub仓库
2. 点击"Add file" → "Upload files"
3. **重要**：打开文件浏览器，导航到项目的`dist`目录
4. **关键步骤**：请确保选择并上传**所有文件和子目录**：
   - 选择`_expo`目录（包含所有JavaScript代码）
   - 选择`assets`目录（包含图标和资源）
   - 选择根文件：`favicon.ico`、`index.html`和`metadata.json`
   - 请不要直接上传整个dist目录，而是上传其内部的所有内容
5. 拖动这些文件和目录到GitHub上传区域
6. 填写提交信息（例如："Update build with all required files"）
7. 点击"Commit changes"完成上传
8. **验证上传**：提交后，检查仓库中是否存在`_expo`、`assets`等目录和文件

**GitHub Pages配置：**
1. 进入仓库的Settings > Pages
2. 源（Source）选择：Deploy from a branch
3. 分支（Branch）选择main
4. **重要**：文件夹（Folder）选择/（根目录）
5. 点击Save
6. 等待几分钟，GitHub Pages会自动构建和部署

**常见问题排查：**
- 确保`_expo`目录被完整上传，这包含了应用的核心代码
- 检查仓库中文件结构是否与本地dist目录结构一致
- 如果仍显示空白页面，请尝试：
  1. 清除浏览器缓存
  2. 强制刷新页面（Ctrl+Shift+R）
  3. 检查浏览器控制台是否有错误信息（按F12打开开发者工具）
  4. 确认GitHub Pages部署状态（在Settings > Pages页面查看）

#### 方式A：直接部署dist目录（需要安装Git）

1. 确保已安装Git（见前置条件部分）
2. 将dist目录添加到版本控制：
   ```bash
   # PowerShell中执行以下命令（分别运行）
   git add dist
   git commit -m "Update build"
   git push origin main  # 或 git push origin master
   ```

3. 配置GitHub Pages：
   - 进入仓库的Settings > Pages
   - 源（Source）选择：Deploy from a branch
   - 分支（Branch）选择main
   - 文件夹（Folder）选择/dist
   - 点击Save

#### 方式B：使用gh-pages包（推荐，需要安装Git）

使用gh-pages包可以更方便地部署：

```bash
# PowerShell中执行以下命令（分别运行，不要使用&&）
# 1. 安装gh-pages
npm install -g gh-pages

# 2. 部署dist目录
gh-pages -d dist
```

**重要提示：** PowerShell 5不支持&&作为命令分隔符，请分别执行每个命令。

这会自动创建gh-pages分支并部署你的应用。

## 验证部署

部署完成后，访问以下URL查看你的应用：
```
https://your-username.github.io/your-repository/
```

## 故障排除

如果仍然遇到空白页面：

1. **检查浏览器控制台错误**：
   - 按F12打开开发者工具
   - 切换到Console标签查看错误
   - 切换到Network标签查看资源加载情况

2. **确认基础路径设置**：
   - 确保index.html中的所有资源路径都是相对路径（以`./`开头）

3. **检查GitHub Pages配置**：
   - 确认选择了正确的分支和目录
   - 等待几分钟让部署完成

4. **使用正确的仓库名称**：
   - 确保URL中的仓库名称与实际名称完全匹配

5. **检查文件大小写**：
   - GitHub Pages是区分大小写的，确保文件名大小写正确

## 开发流程

未来更新应用时，只需重复以下步骤：

```bash
# 1. 更新代码
# 2. 运行构建脚本
node build-web.js
# 3. 部署
# 方式A: 分别执行命令（PowerShell 5不支持&&）
# git add dist
# git commit -m "Update build"
# git push
# 方式B: gh-pages -d dist
```

## 注意事项

- 由于使用AsyncStorage，每个用户的数据将保存在他们自己的浏览器本地存储中
- 静态网站版本在各种现代浏览器中均可正常运行
- 如果应用有后端API需求，需要额外配置CORS或使用代理

如果按照本指南操作仍有问题，请联系开发团队获取支持。