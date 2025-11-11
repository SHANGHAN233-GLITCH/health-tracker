// Script to automatically build web version and fix paths
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting web build process...');

// 清理dist目录（如果存在）
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('Cleaning old build files...');
  try {
    // 使用rimraf的简易实现，处理可能的锁定问题
    function rimrafSync(dir) {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((file) => {
          const curPath = path.join(dir, file);
          if (fs.lstatSync(curPath).isDirectory()) {
            rimrafSync(curPath);
          } else {
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(dir);
      }
    }
    rimrafSync(distPath);
    console.log('Old build files cleaned successfully');
  } catch (err) {
    console.warn('Warning: Unable to completely clean dist directory, files may be locked, but will continue building');
    console.warn(err.message);
  }
}

// 执行导出命令
try {
  console.log('Exporting web version...');
  execSync('npx expo export --platform web', { stdio: 'inherit' });
  console.log('Export successful!');

  // 修正index.html中的路径
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // 替换绝对路径为相对路径
    content = content.replace(/href="\//g, 'href="./');
    content = content.replace(/src="\//g, 'src="./');
    
    // 确保@expo/vector-icons字体文件路径正确
    content = content.replace(/url\('\/assets\//g, 'url(\'./assets/');
    
    fs.writeFileSync(indexPath, content, 'utf8');
    console.log('Path issues in index.html fixed successfully!');
    
    // 验证修改
    const updatedContent = fs.readFileSync(indexPath, 'utf8');
    if (updatedContent.includes('href="./')) {
      console.log('✅ Path fix verification passed');
    } else {
      console.warn('⚠️  Path fix may not have taken effect, please check index.html file');
    }
  } else {
    console.error('❌ Cannot find index.html file');
    process.exit(1);
  }
  
 // Show deployment commands
console.log('\n🎉 Build completed! You can deploy the dist directory to GitHub Pages.\n');
console.log('Deployment options:');
console.log('');
console.log('1. Method C (Currently recommended, no Git required): Manual upload through GitHub web interface');
console.log('   Important note: Make sure to upload all files and subdirectories in the dist directory, especially the _expo directory!');
console.log('   1. Access your GitHub repository');
console.log('   2. Click "Add file" → "Upload files"');
console.log('   3. Open file explorer, navigate to the project\'s dist directory');
console.log('   4. Must select and upload the following:');
console.log('      - _expo directory (contains all JavaScript code)');
console.log('      - assets directory (contains icons and resources)');
console.log('      - favicon.ico, index.html, metadata.json');
console.log('   5. Drag these files and directories to the GitHub upload area');
console.log('   6. Fill in commit information and click "Commit changes"');
console.log('   7. Enable GitHub Pages in repository settings, select main branch and root directory');
console.log('   8. Wait for deployment to complete, clear browser cache before accessing')
console.log('');
console.log('2. Method A (Requires Git): Execute the following commands separately (PowerShell does not support &&)');
console.log('   git add dist');
console.log('   git commit -m "Update build"');
console.log('   git push');
console.log('   Note: If the system prompts that git is not recognized, please install Git first: https://git-scm.com/downloads');
console.log('');
console.log('3. Method B (Recommended, Requires Git): Execute the following commands separately');
console.log('   npm install -g gh-pages');
console.log('   gh-pages -d dist');
console.log('   This is the simplest Git command line method, which automatically handles all deployment steps');
console.log('');
console.log('Detailed deployment instructions can be found in the DEPLOY-GUIDE.md file in the project');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  console.error('Please make sure to stop all processes occupying the dist directory (such as HTTP servers)');
  process.exit(1);
}