const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

// 创建Express应用实例
const app = express();

// 使用中间件
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB限制
  createParentPath: true
}));

// 示例路由
app.get('/', (req, res) => {
  res.json({ message: '活动小程序API服务正常运行中' });
});

// 测试接口
app.get('/api/count', (req, res) => {
  res.json({ count: 1, message: 'API测试成功' });
});

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
