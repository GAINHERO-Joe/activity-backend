const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');

// 获取活动列表
router.get('/', async (req, res) => {
  try {
    // 使用查询参数过滤
    const type = req.query.type;
    const status = req.query.status;
    const limit = parseInt(req.query.limit) || 20;
    
    let query = 'SELECT * FROM activities';
    const queryParams = [];
    
    if (type) {
      query += queryParams.length ? ' AND type = ?' : ' WHERE type = ?';
      queryParams.push(type);
    }
    
    if (status) {
      query += queryParams.length ? ' AND status = ?' : ' WHERE status = ?';
      queryParams.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    queryParams.push(limit);
    
    const [activities] = await db.query(query, queryParams);
    
    res.json(activities.map(activity => ({
      id: activity.id,
      title: activity.title,
      type: activity.type,
      startTime: activity.start_time,
      endTime: activity.end_time,
      location: {
        name: activity.location_name,
        address: activity.location_address
      },
      coverImage: activity.cover_image,
      maxParticipants: activity.max_participants,
      currentParticipants: activity.current_participants,
      status: activity.status,
      createdAt: activity.created_at,
      creatorId: activity.creator_id
    })));
  } catch (error) {
    console.error('获取活动列表失败:', error);
    res.status(500).json({ error: '获取活动列表失败' });
  }
});

// 获取活动详情
router.get('/:id', async (req, res) => {
  try {
    const activityId = req.params.id;
    
    // 获取活动基本信息
    const [activities] = await db.query(`
      SELECT a.*, u.nick_name as creator_name, u.avatar_url as creator_avatar, u.open_id as creator_open_id
      FROM activities a
      LEFT JOIN users u ON a.creator_id = u.id
      WHERE a.id = ?
    `, [activityId]);
    
    if (activities.length === 0) {
      return res.status(404).json({ error: '活动不存在' });
    }
    
    const activity = activities[0];
    
    // 获取活动图片
    const [media] = await db.query(`
      SELECT * FROM activity_media WHERE activity_id = ?
    `, [activityId]);
    
    // 获取参与者
    const [participants] = await db.query(`
      SELECT p.*, u.nick_name, u.avatar_url
      FROM participants p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.activity_id = ?
    `, [activityId]);
    
    // 构建返回数据
    const result = {
      id: activity.id,
      title: activity.title,
      type: activity.type,
      startTime: activity.start_time,
      endTime: activity.end_time,
      location: {
        name: activity.location_name,
        address: activity.location_address,
        coordinates: JSON.parse(activity.location_coordinates || '[]')
      },
      maxParticipants: activity.max_participants,
      currentParticipants: activity.current_participants,
      description: activity.description,
      status: activity.status,
      createdAt: activity.created_at,
      creator: {
        id: activity.creator_id,
        openId: activity.creator_open_id,
        name: activity.creator_name,
        avatar: activity.creator_avatar
      },
      media: media.map(item => ({
        type: item.type,
        url: item.url
      })),
      participants: participants.map(p => ({
        id: p.user_id,
        name: p.nick_name,
        avatar: p.avatar_url,
        joinTime: p.join_time
      }))
    };
    
    res.json(result);
  } catch (error) {
    console.error('获取活动详情失败:', error);
    res.status(500).json({ error: '获取活动详情失败' });
  }
});

// 创建活动
router.post('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const {
      title, type, startTime, endTime, location,
      maxParticipants, description, creator, media
    } = req.body;
    
    // 验证必填字段
    if (!title || !type || !startTime || !endTime || !location || !creator) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    
    // 生成活动ID
    const activityId = `act_${Date.now()}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    // 确保用户存在
    const [users] = await conn.query('SELECT * FROM users WHERE id = ?', [creator.id]);
    if (users.length === 0) {
      await conn.query(`
        INSERT INTO users (id, open_id, nick_name, avatar_url)
        VALUES (?, ?, ?, ?)
      `, [creator.id, creator.openId, creator.name, creator.avatar]);
    }
    
    // 创建活动
    await conn.query(`
      INSERT INTO activities (
        id, title, type, start_time, end_time,
        location_name, location_address, location_coordinates,
        max_participants, current_participants,
        description, cover_image, status, creator_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      activityId, title, type, startTime, endTime,
      location.name, location.address, JSON.stringify(location.coordinates || []),
      maxParticipants || 0, 1, description,
      media && media.length > 0 ? media[0].url : null,
      'upcoming', creator.id
    ]);
    
    // 添加媒体文件
    if (media && media.length > 0) {
      const mediaValues = media.map(item => [
        activityId, item.type || 'image', item.url
      ]);
      
      await conn.query(`
        INSERT INTO activity_media (activity_id, type, url)
        VALUES ?
      `, [mediaValues]);
    }
    
    // 添加创建者作为第一个参与者
    await conn.query(`
      INSERT INTO participants (activity_id, user_id)
      VALUES (?, ?)
    `, [activityId, creator.id]);
    
    await conn.commit();
    res.status(201).json({
      id: activityId,
      message: '活动创建成功'
    });
  } catch (error) {
    await conn.rollback();
    console.error('创建活动失败:', error);
    res.status(500).json({ error: '创建活动失败' });
  } finally {
    conn.release();
  }
});

// 报名参加活动
router.post('/:id/register', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const activityId = req.params.id;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }
    
    // 检查活动是否存在
    const [activities] = await conn.query('SELECT * FROM activities WHERE id = ?', [activityId]);
    if (activities.length === 0) {
      return res.status(404).json({ error: '活动不存在' });
    }
    
    const activity = activities[0];
    
    // 检查是否已报名
    const [existingRegistrations] = await conn.query(
      'SELECT * FROM participants WHERE activity_id = ? AND user_id = ?',
      [activityId, userId]
    );
    
    if (existingRegistrations.length > 0) {
      return res.status(400).json({ error: '已经报名该活动' });
    }
    
    // 检查人数是否已满
    if (activity.max_participants > 0 && activity.current_participants >= activity.max_participants) {
      return res.status(400).json({ error: '活动人数已满' });
    }
    
    // 添加参与者
    await conn.query(
      'INSERT INTO participants (activity_id, user_id) VALUES (?, ?)',
      [activityId, userId]
    );
    
    // 更新活动参与人数
    await conn.query(
      'UPDATE activities SET current_participants = current_participants + 1 WHERE id = ?',
      [activityId]
    );
    
    await conn.commit();
    res.json({ message: '报名成功' });
  } catch (error) {
    await conn.rollback();
    console.error('报名活动失败:', error);
    res.status(500).json({ error: '报名活动失败' });
  } finally {
    conn.release();
  }
});

// 活动签到
router.post('/:id/checkin', async (req, res) => {
  try {
    const activityId = req.params.id;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }
    
    // 检查是否已报名
    const [participants] = await db.query(
      'SELECT * FROM participants WHERE activity_id = ? AND user_id = ?',
      [activityId, userId]
    );
    
    if (participants.length === 0) {
      return res.status(400).json({ error: '未报名该活动，无法签到' });
    }
    
    // 检查是否已签到
    const [checkIns] = await db.query(
      'SELECT * FROM check_ins WHERE activity_id = ? AND user_id = ?',
      [activityId, userId]
    );
    
    if (checkIns.length > 0) {
      return res.status(400).json({ error: '已经签到过了' });
    }
    
    // 添加签到记录
    const checkInId = `checkin_${Date.now()}`;
    await db.query(
      'INSERT INTO check_ins (id, activity_id, user_id) VALUES (?, ?, ?)',
      [checkInId, activityId, userId]
    );
    
    res.json({ message: '签到成功' });
  } catch (error) {
    console.error('活动签到失败:', error);
    res.status(500).json({ error: '活动签到失败' });
  }
});

module.exports = router;
