import { pool } from '../config/db';
import { Request, Response } from 'express';
import { createNotification } from './notificationController';

// Get all comments for a post
export const getCommentsByPostId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { postId } = req.params;
        
        const result = await pool.query(
            `SELECT 
                c.id AS _id,
                c.content,
                c.created_at AS "createdAt",
                JSON_BUILD_OBJECT('_id', u.id, 'username', u.username) AS author
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.post_id = $1
             ORDER BY c.created_at ASC`,
            [postId]
        );

        res.status(200).json({ comments: result.rows });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Create a comment
export const createComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { postId } = req.params;
        const { content, userId } = req.body;

        if (!content || !userId) {
            res.status(400).json({ message: 'Content and userId are required' });
            return;
        }

        // Check if post exists and get author
        const postCheck = await pool.query('SELECT id, author_id FROM posts WHERE id = $1', [postId]);
        if (postCheck.rows.length === 0) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }

        const result = await pool.query(
            `INSERT INTO comments (content, post_id, user_id, created_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             RETURNING *`,
            [content, postId, userId]
        );

        // Create notification for post author
        await createNotification(postCheck.rows[0].author_id, parseInt(userId), parseInt(postId as string), 'comment');

        // Get comment with author info
        const commentWithAuthor = await pool.query(
            `SELECT 
                c.id AS _id,
                c.content,
                c.created_at AS "createdAt",
                JSON_BUILD_OBJECT('_id', u.id, 'username', u.username) AS author
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.id = $1`,
            [result.rows[0].id]
        );

        res.status(201).json({ message: 'Comment added successfully', comment: commentWithAuthor.rows[0] });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Update a comment
export const updateComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { content, userId } = req.body;

        // Check if comment exists and user is author
        const commentCheck = await pool.query('SELECT user_id FROM comments WHERE id = $1', [id]);
        
        if (commentCheck.rows.length === 0) {
            res.status(404).json({ message: 'Comment not found' });
            return;
        }

        if (commentCheck.rows[0].user_id !== parseInt(userId)) {
            res.status(403).json({ message: 'Not authorized to edit this comment' });
            return;
        }

        const result = await pool.query(
            `UPDATE comments SET content = $1 WHERE id = $2 RETURNING *`,
            [content, id]
        );

        // Get updated comment with author info
        const commentWithAuthor = await pool.query(
            `SELECT 
                c.id AS _id,
                c.content,
                c.created_at AS "createdAt",
                JSON_BUILD_OBJECT('_id', u.id, 'username', u.username) AS author
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.id = $1`,
            [id]
        );

        res.status(200).json({ message: 'Comment updated successfully', comment: commentWithAuthor.rows[0] });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Delete a comment
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.body.userId || req.query.userId;

        // Check if comment exists and user is author
        const commentCheck = await pool.query('SELECT user_id FROM comments WHERE id = $1', [id]);
        
        if (commentCheck.rows.length === 0) {
            res.status(404).json({ message: 'Comment not found' });
            return;
        }

        if (commentCheck.rows[0].user_id !== parseInt(userId)) {
            res.status(403).json({ message: 'Not authorized to delete this comment' });
            return;
        }

        await pool.query('DELETE FROM comments WHERE id = $1', [id]);

        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};
