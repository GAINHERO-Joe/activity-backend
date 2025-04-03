const express = require('express');
const router = express.Router();

// 模拟数据
let comments = [
  {
    id: 'comment1',
    activityId: '1',
    userId: 'user2',
    userName: '李四',
    userAvatar: 'https://example.com/avatar2.jpg',
    content: '这个活动看起来很有趣，期待参加！',
    createdAt: '2025-04-05T09:30:00',
    likes: 0
  },
  {
    id: 'comment2',
    activityId: '1',
    userId: 'user1',
    userName: '张三',
    userAvatar: 'https://example.com/avatar1.jpg',
    content: '欢迎大家参加这个活动，有任何问题可以在评论区提问。',
    createdAt: '2025-04-05T10:15:00',
    likes: 2
  },
  {
    id: 'comment3',
    activityId: '2',
    userId: 'user1',
    userName: '张三',
    userAvatar: 'https://example.com/avatar1.jpg',
    content: '这个编程工作坊适合初学者吗？',
    createdAt: '2025-04-06T08:45:00',
    likes: 0
  }
];

// 获取活动评论
router.get('/activity/:activityId', (req, res) => {
  try {
    const activityId = req.params.activityId;
    const activityComments = comments.filter(c => c.activityId === activityId);
    
    // 按时间排序，最新的在前
    activityComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, data: activityComments });
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ success: false, message: '获取评论失败' });
  }
});

// 添加评论
router.post('/', (req, res) => {
  try {
    const { activityId, userId, userName, userAvatar, content } = req.body;
    
    if (!activityId || !userId || !content) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    // 创建新评论
    const newComment = {
      id: `comment${Date.now()}`,
      activityId,
      userId,
      userName: userName || '匿名用户',
      userAvatar: userAvatar || '',
      content,
      createdAt: new Date().toISOString(),
      likes: 0
    };
    
    comments.push(newComment);
    
    res.status(201).json({ success: true, data: newComment });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({ success: false, message: '添加评论失败' });
  }
});

// 删除评论
router.delete('/:id', (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.query.userId; // 通常从认证中获取
    
    if (!userId) {
      return res.status(400).json({ success: false, message: '需要用户ID' });
    }
    
    const commentIndex = comments.findIndex(c => c.id === commentId);
    
    if (commentIndex === -1) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }
    
    const comment = comments[commentIndex];
    
    // 只有评论作者才能删除评论
    if (comment.userId !== userId) {
      return res.status(403).json({ success: false, message: '无权删除此评论' });
    }
    
    // 删除评论
    comments.splice(commentIndex, 1);
    
    res.json({ success: true, message: '评论已删除' });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ success: false, message: '删除评论失败' });
  }
});

// 点赞评论
router.post('/:id/like', (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: '需要用户ID' });
    }
    
    const commentIndex = comments.findIndex(c => c.id === commentId);
    
    if (commentIndex === -1) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }
    
    // 简单实现：直接增加点赞数
    // 实际应用中应该记录哪些用户点赞过，防止重复点赞
    comments[commentIndex].likes += 1;
    
    res.json({ 
      success: true, 
      message: '点赞成功', 
      data: { likes: comments[commentIndex].likes } 
    });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ success: false, message: '点赞失败' });
  }
});

module.exports = router;
