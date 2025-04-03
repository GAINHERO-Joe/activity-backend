const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 获取活动评论
router.get('/', async (req, res) => {
  try {
    const { activityId } = req.query;
    
    if (!activityId) {
      return res.status(400).json({ error: '缺少活动ID参数' });
    }
    
    const [comments] = await db.query(`
      SELECT c.*, u.nick_name, u.avatar_url 
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.activity_id = ?
      ORDER BY c.created_at DESC
    `, [activityId]);
    
    // 获取评论的媒体文件
    const commentIds = comments.map(c => c.id);
    let commentMedia = [];
    
    if (commentIds.length > 0) {
      const [media] = await db.query(`
        SELECT * FROM comment_media 
        WHERE comment_id IN (?)
      `, [commentIds]);
      
      commentMedia = media;
    }
    
    // 构建返回数据，包含评论和对应的媒体文件
    const result = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.created_at,
      user: {
        id: comment.user_id,
        name: comment.nick_name,
        avatar: comment.avatar_url
      },
      media: commentMedia
        .filter(m => m.comment_id === comment.id)
        .map(m => ({ url: m.url }))
    }));
    
    res.json(result);
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ error: '获取评论失败' });
  }
});

// 添加评论
router.post('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const { activityId, userId, content, media } = req.body;
    
    if (!activityId || !userId || !content) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 检查活动是否存在
    const [activities] = await conn.query('SELECT * FROM activities WHERE id = ?', [activityId]);
    if (activities.length === 0) {
      return res.status(404).json({ error: '活动不存在' });
    }
    
    // 生成评论ID
    const commentId = `comment_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // 添加评论
    await conn.query(`
      INSERT INTO comments (id, activity_id, user_id, content)
      VALUES (?, ?, ?, ?)
    `, [commentId, activityId, userId, content]);
    
    // 添加评论媒体文件
    if (media && media.length > 0) {
      const mediaValues = media.map(item => [commentId, item.url]);
      
      await conn.query(`
        INSERT INTO comment_media (comment_id, url)
        VALUES ?
      `, [mediaValues]);
    }
    
    await conn.commit();
    res.status(201).json({
      id: commentId,
      message: '评论添加成功'
    });
  } catch (error) {
    await conn.rollback();
    console.error('添加评论失败:', error);
    res.status(500).json({ error: '添加评论失败' });
  } finally {
    conn.release();
  }
});

router.get('/', (req, res) => {
  res.json({ message: '评论列表', data: [] });
});

module.exports = router;
