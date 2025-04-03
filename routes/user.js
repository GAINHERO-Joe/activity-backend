const express = require('express');
const router = express.Router();
const db = require('../models/db');
const axios = require('axios');

// 微信小程序配置
const APPID = process.env.WX_APPID;
const SECRET = process.env.WX_SECRET;

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: '缺少code参数' });
    }
    
    // 调用微信接口获取openid，这里是示例代码，实际使用需要配置APPID和SECRET
    let openid, session_key;
    
    if (APPID && SECRET) {
      // 正式环境，调用微信API
      const wxLoginUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`;
      const response = await axios.get(wxLoginUrl);
      
      if (response.data.errcode) {
        return res.status(400).json({ error: '微信登录失败', wxError: response.data.errmsg });
      }
      
      openid = response.data.openid;
      session_key = response.data.session_key;
    } else {
      // 开发环境，模拟openid
      console.log('警告: 未配置微信APPID和SECRET，使用模拟openid');
      openid = `simulated_${code}_${Date.now()}`;
      session_key = 'simulated_session_key';
    }
    
    // 查询用户是否存在
    const [users] = await db.query('SELECT * FROM users WHERE open_id = ?', [openid]);
    
    let userId;
    if (users.length > 0) {
      // 用户已存在，返回用户信息
      userId = users[0].id;
    } else {
      // 用户不存在，创建新用户
      userId = `user_${Date.now()}`;
      await db.query(`
        INSERT INTO users (id, open_id, nick_name, avatar_url)
        VALUES (?, ?, ?, ?)
      `, [userId, openid, '微信用户', '']);
    }
    
    res.json({
      userId: userId,
      openid: openid,
      isNewUser: users.length === 0
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({ error: '用户登录失败' });
  }
});

// 获取用户信息
router.get('/:id', (req, res) => {
  res.json({ message: `获取用户${req.params.id}信息` });
});

// 更新用户信息
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { nickName, avatarUrl } = req.body;
    
    if (!nickName && !avatarUrl) {
      return res.status(400).json({ error: '没有提供要更新的信息' });
    }
    
    // 构建更新语句
    let updateQuery = 'UPDATE users SET';
    const queryParams = [];
    
    if (nickName) {
      updateQuery += ' nick_name = ?';
      queryParams.push(nickName);
    }
    
    if (avatarUrl) {
      if (nickName) updateQuery += ',';
      updateQuery += ' avatar_url = ?';
      queryParams.push(avatarUrl);
    }
    
    updateQuery += ' WHERE id = ?';
    queryParams.push(userId);
    
    // 执行更新
    const [result] = await db.query(updateQuery, queryParams);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ message: '用户信息更新成功' });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
});

module.exports = router;
