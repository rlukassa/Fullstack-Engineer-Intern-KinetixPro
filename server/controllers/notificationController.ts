import { pool } from '../config/db';
import { Request, Response } from 'express';

// Create notification helper function
export const createNotification = async (
    userId: number, 
    actorId: number, 
    postId: number, 
    type: 'like' | 'bookmark' | 'comment'
): Promise<void> => {
    try {
        // Don't create notification if user is acting on their own post
        if (userId === actorId) return;

        // Check if similar notification exists (to avoid spam)
        const existing = await pool.query(
            `SELECT id FROM notifications 
             WHERE user_id = $1 AND actor_id = $2 AND post_id = $3 AND type = $4 
             AND created_at > NOW() - INTERVAL '1 hour'`,
            [userId, actorId, postId, type]
        );

        if (existing.rows.length === 0) {
            await pool.query(
                `INSERT INTO notifications (user_id, actor_id, post_id, type)
                 VALUES ($1, $2, $3, $4)`,
                [userId, actorId, postId, type]
            );
        }
    } catch (error) {
        console.error('Create notification error:', error);
    }
};

// Get notifications for a user
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            `SELECT 
                n.id AS _id,
                n.type,
                n.is_read AS "isRead",
                n.created_at AS "createdAt",
                JSON_BUILD_OBJECT('_id', actor.id, 'username', actor.username) AS actor,
                JSON_BUILD_OBJECT(
                    '_id', p.id, 
                    'title', p.title, 
                    'caption', SUBSTRING(p.caption, 1, 50)
                ) AS post
             FROM notifications n
             LEFT JOIN users actor ON n.actor_id = actor.id
             LEFT JOIN posts p ON n.post_id = p.id
             WHERE n.user_id = $1
             ORDER BY n.created_at DESC
             LIMIT 50`,
            [userId]
        );

        res.status(200).json({ notifications: result.rows });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1',
            [id]
        );

        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
            [userId]
        );

        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Get unread notification count
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
            [userId]
        );

        res.status(200).json({ count: result.rows[0]?.count || 0 });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};
