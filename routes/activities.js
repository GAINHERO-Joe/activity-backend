const express = require('express');
const router = express.Router();

// 模拟数据
let activities = [
  {
    id: '1',
    title: '春季户外徒步',
    description: '欢迎参加我们的春季户外徒步活动，将在郊外进行一次轻松愉快的远足。',
    location: '市郊森林公园',
    startTime: '2025-04-15T09:00:00',
    endTime: '2025-04-15T18:00:00',
    creatorId: 'user1',
    creatorName: '张三',
    creatorAvatar: 'https://example.com/avatar1.jpg',
    coverImage: 'https://example.com/hike.jpg',
    category: '运动',
    maxParticipants: 20,
    participants: [],
    createdAt: '2025-04-01T10:00:00'
  },
  {
    id: '2',
    title: '编程工作坊',
    description: '学习最新的Web开发技术，从基础到高级的一系列课程。',
    location: '创新中心',
    startTime: '2025-04-20T14:00:00',
    endTime: '2025-04-20T17:00:00',
    creatorId: 'user2',
    creatorName: '李四',
    creatorAvatar: 'https://example.com/avatar2.jpg',
    coverImage: 'https://example.com/coding.jpg',
    category: '教育',
    maxParticipants: 15,
    participants: [],
    createdAt: '2025-04-02T08:30:00'
  }
];

// 获取活动列表
router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    data: activities
  });
});

// 获取单个活动详情
router.get('/:id', (req, res) => {
  const activity = activities.find(a => a.id === req.params.id);
  
  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }
  
  res.json({ success: true, data: activity });
});

// 创建新活动
router.post('/', (req, res) => {
  try {
    const newActivity = {
      id: Date.now().toString(),
      ...req.body,
      participants: [],
      createdAt: new Date().toISOString()
    };
    
    activities.push(newActivity);
    res.status(201).json({ success: true, data: newActivity });
  } catch (error) {
    console.error('创建活动失败:', error);
    res.status(500).json({ success: false, message: '创建活动失败' });
  }
});

// 注册参加活动
router.post('/:id/register', (req, res) => {
  try {
    const activity = activities.find(a => a.id === req.params.id);
    
    if (!activity) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }
    
    const { userId, userName, userAvatar } = req.body;
    
    if (!userId || !userName) {
      return res.status(400).json({ success: false, message: '用户信息不完整' });
    }
    
    // 检查用户是否已经注册过
    if (activity.participants.some(p => p.userId === userId)) {
      return res.status(400).json({ success: false, message: '用户已经注册过此活动' });
    }
    
    // 检查是否已达到最大参与人数
    if (activity.maxParticipants && activity.participants.length >= activity.maxParticipants) {
      return res.status(400).json({ success: false, message: '活动参与人数已满' });
    }
    
    // 添加用户到参与者列表
    activity.participants.push({
      userId,
      userName,
      userAvatar: userAvatar || '',
      registeredAt: new Date().toISOString()
    });
    
    res.json({ success: true, message: '注册成功', data: activity });
  } catch (error) {
    console.error('活动注册失败:', error);
    res.status(500).json({ success: false, message: '活动注册失败' });
  }
});

// 签到
router.post('/:id/checkin', (req, res) => {
  try {
    const activity = activities.find(a => a.id === req.params.id);
    
    if (!activity) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }
    
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }
    
    // 检查用户是否已注册
    const participant = activity.participants.find(p => p.userId === userId);
    if (!participant) {
      return res.status(400).json({ success: false, message: '用户未注册此活动' });
    }
    
    // 标记签到
    participant.checkedIn = true;
    participant.checkinTime = new Date().toISOString();
    
    res.json({ success: true, message: '签到成功' });
  } catch (error) {
    console.error('签到失败:', error);
    res.status(500).json({ success: false, message: '签到失败' });
  }
});

module.exports = router;
// 导出activities供其他模块使用
module.exports.activities = activities;
