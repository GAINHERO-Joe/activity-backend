const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fileUpload = require('express-fileupload');

// 导入路由
const activityRoutes = require('./routes/activities');
const userRoutes = require('./routes/users');
const commentRoutes = require('./routes/comments');

// 创建Express应用实例
const app = express();

// 使用中间件
app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB限制
  createParentPath: true
}));

// 根路由
app.get('/', (req, res) => {
  res.json({ message: '活动小程序API服务正常运行中' });
});

// 测试API
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API测试成功',
    env: process.env.NODE_ENV,
    serverTime: new Date().toISOString()
  });
});

// 注册API路由
app.use('/api/activities', activityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);

// 添加文件上传路由
app.post('/api/upload', (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '没有上传文件' 
      });
    }
    
    const activityId = req.body.activityId || 'common';
    const uploadPath = path.join(__dirname, 'uploads', activityId);
    
    // 确保目录存在
    require('fs').mkdirSync(uploadPath, { recursive: true });
    
    // 处理上传的文件
    const uploadedFiles = [];
    const files = req.files.files;
    
    if (Array.isArray(files)) {
      // 多文件上传
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${Date.now()}_${i}_${file.name}`;
        const filePath = path.join(uploadPath, fileName);
        
        file.mv(filePath);
        uploadedFiles.push({
          url: `/uploads/${activityId}/${fileName}`,
          type: 'image',
          name: file.name
        });
      }
    } else {
      // 单文件上传
      const fileName = `${Date.now()}_${files.name}`;
      const filePath = path.join(uploadPath, fileName);
      
      files.mv(filePath);
      uploadedFiles.push({
        url: `/uploads/${activityId}/${fileName}`,
        type: 'image',
        name: files.name
      });
    }
    
    res.json(uploadedFiles);
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '文件上传失败' 
    });
  }
});

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 在全局范围共享数据(仅用于演示)
global.activities = require('./routes/activities').activities;

// 404处理
app.use((req, res, next) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
const port = process.env.PORT || 80;
app.listen(port, () => {
  console.log(`服务器运行在端口 ${port}`);
});

module.exports = app;
