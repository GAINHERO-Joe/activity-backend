const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// 导入路由
const activityRoutes = require('./routes/activities');
const userRoutes = require('./routes/users');
const commentRoutes = require('./routes/comments');

// 创建Express应用实例
const app = express();

// 使用中间件
app.use(bodyParser.json());
app.use(cors());

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
