const express = require('express')
const path = require('path')
const cors = require('cors')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const mysql = require('mysql2/promise')

const activityRoutes = require('./routes/activities')
const userRoutes = require('./routes/users')
const commentRoutes = require('./routes/comments')

// 创建Express应用实例
const app = express()

// 使用中间件
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(cors())
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB限制
  createParentPath: true
}))

// 设置路由
app.use('/api/activities', activityRoutes)
app.use('/api/users', userRoutes)
app.use('/api/comments', commentRoutes)

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 404处理
app.use((req, res, next) => {
  res.status(404).json({ error: '接口不存在' })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: '服务器内部错误' })
})

// 创建连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'WvZHByZ3',
  database: process.env.DB_NAME || 'wxcloud',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// 启动服务器
const port = process.env.PORT || 80
app.listen(port, () => {
  console.log(`服务器运行在端口 ${port}`)
})

module.exports = { app, pool }
