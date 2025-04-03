const express = require('express');
const router = express.Router();

// 模拟数据
let users = [
  {
    id: 'user1',
    openId: 'oXYZ123456789',
    nickName: '张三',
    avatarUrl: 'https://example.com/avatar1.jpg',
    gender: 1,
    country: '中国',
    province: '北京',
    city: '北京',
    language: 'zh_CN',
    createdActivities: ['1'],
    joinedActivities: [],
    createdAt: '2025-03-15T08:00:00'
  },
  {
    id: 'user2',
    openId: 'oABC987654321',
    nickName: '李四',
    avatarUrl: 'https://example.com/avatar2.jpg',
    gender: 1,
    country: '中国',
    province: '上海',
    city: '上海',
    language: 'zh_CN',
    createdActivities: ['2'],
    joinedActivities: [],
    createdAt: '2025-03-20T10:30:00'
  }
];

// 用户登录或创建用户
router.post('/login', (req, res) => {
  try {
    const { code, userInfo } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: '缺少必要的code参数' });
    }
    
    // 模拟微信登录，实际应与微信API交互
    // 这里简单返回一个模拟的用户或创建新用户
    const mockOpenId = `o${Math.random().toString(36).substring(2, 10)}`;
    
    // 检查用户是否已存在
    let user = users.find(u => u.openId === mockOpenId);
    
    // 不存在则创建新用户
    if (!user) {
      user = {
        id: `user${Date.now()}`,
        openId: mockOpenId,
        nickName: userInfo?.nickName || '新用户',
        avatarUrl: userInfo?.avatarUrl || '',
        gender: userInfo?.gender || 0,
        country: userInfo?.country || '',
        province: userInfo?.province || '',
        city: userInfo?.city || '',
        language: userInfo?.language || 'zh_CN',
        createdActivities: [],
        joinedActivities: [],
        createdAt: new Date().toISOString()
      };
      
      users.push(user);
    }
    
    // 更新用户信息(如果提供了)
    if (userInfo) {
      user.nickName = userInfo.nickName || user.nickName;
      user.avatarUrl = userInfo.avatarUrl || user.avatarUrl;
      user.gender = userInfo.gender || user.gender;
      user.country = userInfo.country || user.country;
      user.province = userInfo.province || user.province;
      user.city = userInfo.city || user.city;
      user.language = userInfo.language || user.language;
    }
    
    res.json({
      success: true,
      data: {
        userId: user.id,
        openId: user.openId,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({ success: false, message: '用户登录失败' });
  }
});

// 获取用户信息
router.get('/:id', (req, res) => {
  try {
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    // 不返回敏感信息
    const { openId, ...userInfo } = user;
    
    res.json({ success: true, data: userInfo });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

// 更新用户信息
router.put('/:id', (req, res) => {
  try {
    const userId = req.params.id;
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    const { nickName, avatarUrl, gender, country, province, city, language } = req.body;
    
    // 更新可变更的字段
    if (nickName) users[userIndex].nickName = nickName;
    if (avatarUrl) users[userIndex].avatarUrl = avatarUrl;
    if (gender !== undefined) users[userIndex].gender = gender;
    if (country) users[userIndex].country = country;
    if (province) users[userIndex].province = province;
    if (city) users[userIndex].city = city;
    if (language) users[userIndex].language = language;
    
    res.json({ success: true, message: '用户信息更新成功', data: users[userIndex] });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ success: false, message: '更新用户信息失败' });
  }
});

// 获取用户创建的活动
router.get('/:id/created-activities', (req, res) => {
  try {
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    // 假设activities是全局可用的
    // 在真实场景中，应该从对应的活动路由或服务中获取
    const activities = global.activities || [];
    const userActivities = activities.filter(a => a.creatorId === user.id);
    
    res.json({ success: true, data: userActivities });
  } catch (error) {
    console.error('获取用户创建的活动失败:', error);
    res.status(500).json({ success: false, message: '获取用户创建的活动失败' });
  }
});

// 获取用户参加的活动
router.get('/:id/joined-activities', (req, res) => {
  try {
    const userId = req.params.id;
    
    // 假设activities是全局可用的
    const activities = global.activities || [];
    const joinedActivities = activities.filter(a => 
      a.participants && a.participants.some(p => p.userId === userId)
    );
    
    res.json({ success: true, data: joinedActivities });
  } catch (error) {
    console.error('获取用户参加的活动失败:', error);
    res.status(500).json({ success: false, message: '获取用户参加的活动失败' });
  }
});

module.exports = router; 