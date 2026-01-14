<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Sidebar from '../components/Sidebar.component.vue';
import Popup from '../components/Popup.component.vue';
import api from '../services/api';
import { authService } from '../services/auth';
import { parseMarkdown } from '../utils/markdown';

interface Author {
    _id: string | number;
    username: string;
}

interface Comment {
    _id: string | number;
    content: string;
    author: Author;
    createdAt: string;
}

interface Post {
    _id: string | number;
    title: string;
    caption: string;
    image?: string;
    likes: number;
    comments: number;
    author: Author;
    createdAt: string;
    isEdited: boolean;
}

const route = useRoute();
const router = useRouter();

const post = ref<Post | null>(null);
const comments = ref<Comment[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const currentUserId = computed(() => authService.getUserId());
const isAuthor = computed(() => post.value?.author?._id?.toString() === currentUserId.value);

const newComment = ref('');
const submittingComment = ref(false);

const isEditing = ref(false);
const editTitle = ref('');
const editCaption = ref('');
const savingEdit = ref(false);

const editingCommentId = ref<string | number | null>(null);
const editCommentContent = ref('');

const showDeletePostPopup = ref(false);
const showDeleteCommentPopup = ref(false);
const commentToDelete = ref<string | number | null>(null);

const postId = computed(() => route.params.id as string);

const fetchPost = async () => {
    try {
        const response = await api.get(`/posts/${postId.value}`);
        post.value = response.data.post;
    } catch (err: any) {
        error.value = 'Failed to load post';
        console.error(err);
    }
};

const fetchComments = async () => {
    try {
        const response = await api.get(`/posts/${postId.value}/comments`);
        comments.value = response.data.comments;
    } catch (err: any) {
        console.error('Failed to load comments:', err);
    } finally {
        loading.value = false;
    }
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const startEditing = () => {
    if (post.value) {
        editTitle.value = post.value.title;
        editCaption.value = post.value.caption;
        isEditing.value = true;
    }
};

const cancelEditing = () => {
    isEditing.value = false;
    editTitle.value = '';
    editCaption.value = '';
};

const saveEdit = async () => {
    if (!editTitle.value.trim() || !editCaption.value.trim()) return;
    
    savingEdit.value = true;
    try {
        await api.put(`/posts/${postId.value}`, {
            title: editTitle.value,
            caption: editCaption.value,
            image: post.value?.image,
            authorId: currentUserId.value
        });
        
        await fetchPost();
        isEditing.value = false;
    } catch (err: any) {
        console.error('Failed to update post:', err);
        alert('Failed to update post');
    } finally {
        savingEdit.value = false;
    }
};

const confirmDeletePost = () => {
    showDeletePostPopup.value = true;
};

const deletePost = async () => {
    try {
        await api.delete(`/posts/${postId.value}?authorId=${currentUserId.value}`);
        router.push('/');
    } catch (err: any) {
        console.error('Failed to delete post:', err);
        alert('Failed to delete post');
    }
    showDeletePostPopup.value = false;
};

const submitComment = async () => {
    if (!newComment.value.trim()) return;
    
    submittingComment.value = true;
    try {
        await api.post(`/posts/${postId.value}/comments`, {
            content: newComment.value,
            userId: currentUserId.value
        });
        
        newComment.value = '';
        await fetchComments();
        if (post.value) {
            post.value.comments = comments.value.length;
        }
    } catch (err: any) {
        console.error('Failed to add comment:', err);
        alert('Failed to add comment');
    } finally {
        submittingComment.value = false;
    }
};

const startEditingComment = (comment: Comment) => {
    editingCommentId.value = comment._id;
    editCommentContent.value = comment.content;
};

const cancelEditingComment = () => {
    editingCommentId.value = null;
    editCommentContent.value = '';
};

const saveCommentEdit = async (commentId: string | number) => {
    if (!editCommentContent.value.trim()) return;
    
    try {
        await api.put(`/comments/${commentId}`, {
            content: editCommentContent.value,
            userId: currentUserId.value
        });
        
        await fetchComments();
        editingCommentId.value = null;
        editCommentContent.value = '';
    } catch (err: any) {
        console.error('Failed to update comment:', err);
        alert('Failed to update comment');
    }
};

const confirmDeleteComment = (commentId: string | number) => {
    commentToDelete.value = commentId;
    showDeleteCommentPopup.value = true;
};

const deleteComment = async () => {
    if (!commentToDelete.value) return;
    
    try {
        await api.delete(`/comments/${commentToDelete.value}?userId=${currentUserId.value}`);
        await fetchComments();
        if (post.value) {
            post.value.comments = comments.value.length;
        }
    } catch (err: any) {
        console.error('Failed to delete comment:', err);
        alert('Failed to delete comment');
    }
    showDeleteCommentPopup.value = false;
    commentToDelete.value = null;
};

const goToProfile = (userId: string | number) => {
    router.push(`/profile/${userId}`);
};

const goBack = () => {
    router.back();
};

onMounted(async () => {
    await fetchPost();
    await fetchComments();
});
</script>

<template>
    <div class="detail-post">
        <Sidebar />
        
        <main class="main-content">
            <div class="container">
                <div class="page-header">
                    <button class="back-btn" @click="goBack">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="currentColor" d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"/>
                        </svg>
                    </button>
                    <h2>Post</h2>
                </div>

                <div v-if="loading" class="loading-state">
                    <span>Loading post...</span>
                </div>

                <div v-else-if="error || !post" class="error-state">
                    <span>{{ error || 'Post not found' }}</span>
                </div>

                <div v-else class="post-detail">
                    <div class="post-main">
                        <div class="post-author">
                            <div class="avatar" @click="goToProfile(post.author?._id)">
                                <img src="/default-avatar.svg" alt="avatar" />
                            </div>
                            <div class="author-info">
                                <span class="display-name" @click="goToProfile(post.author?._id)">{{ post.author?.username }}</span>
                                <span class="username">@{{ post.author?.username }}</span>
                            </div>
                            
                            <div v-if="isAuthor && !isEditing" class="author-actions">
                                <button class="action-btn edit-btn" @click="startEditing" title="Edit">
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                    </svg>
                                </button>
                                <button class="action-btn delete-btn" @click="confirmDeletePost" title="Delete">
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <path fill="currentColor" d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div v-if="isEditing" class="edit-form">
                            <input v-model="editTitle" class="edit-title" placeholder="Title" />
                            <textarea v-model="editCaption" class="edit-caption" placeholder="What's happening? (Markdown supported)" rows="6"></textarea>
                            <p class="markdown-hint">Markdown supported: **bold**, *italic*, `code`, # headings, - lists</p>
                            <div class="edit-actions">
                                <button class="btn-cancel" @click="cancelEditing">Cancel</button>
                                <button class="btn-save" @click="saveEdit" :disabled="savingEdit || !editTitle.trim() || !editCaption.trim()">
                                    {{ savingEdit ? 'Saving...' : 'Save' }}
                                </button>
                            </div>
                        </div>

                        <template v-else>
                            <div class="post-content">
                                <h1 class="post-title">{{ post.title }}</h1>
                                <div class="post-caption markdown-content" v-html="parseMarkdown(post.caption)"></div>
                            </div>

                            <div v-if="post.image" class="post-image">
                                <img :src="post.image" :alt="post.title" />
                            </div>

                            <div class="post-meta">
                                <span class="post-date">{{ formatDate(post.createdAt) }}</span>
                                <span v-if="post.isEdited" class="edited-badge">· Edited</span>
                            </div>

                            <div class="post-stats">
                                <div class="stat">
                                    <span class="stat-value">0</span>
                                    <span class="stat-label">Retweets</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-value">{{ post.likes }}</span>
                                    <span class="stat-label">Likes</span>
                                </div>
                            </div>

                            <div class="post-actions">
                                <button class="action-btn">
                                    <svg viewBox="0 0 24 24" width="22" height="22">
                                        <path fill="currentColor" d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/>
                                    </svg>
                                </button>
                                <button class="action-btn">
                                    <svg viewBox="0 0 24 24" width="22" height="22">
                                        <path fill="currentColor" d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/>
                                    </svg>
                                </button>
                                <button class="action-btn">
                                    <svg viewBox="0 0 24 24" width="22" height="22">
                                        <path fill="currentColor" d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/>
                                    </svg>
                                </button>
                                <button class="action-btn">
                                    <svg viewBox="0 0 24 24" width="22" height="22">
                                        <path fill="currentColor" d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"/>
                                    </svg>
                                </button>
                            </div>
                        </template>
                    </div>

                    <div class="reply-composer">
                        <div class="composer-avatar">
                            <img src="/default-avatar.svg" alt="Your avatar" />
                        </div>
                        <div class="composer-input-wrapper">
                            <textarea 
                                v-model="newComment" 
                                class="composer-input" 
                                placeholder="Post your reply"
                                rows="2"
                            ></textarea>
                            <button 
                                class="btn-reply" 
                                @click="submitComment"
                                :disabled="!newComment.trim() || submittingComment"
                            >
                                {{ submittingComment ? 'Posting...' : 'Reply' }}
                            </button>
                        </div>
                    </div>

                    <div class="comments-section">
                        <div v-if="comments.length === 0" class="no-comments">
                            <p>No replies yet. Be the first to reply!</p>
                        </div>

                        <div v-else class="comments-list">
                            <div v-for="comment in comments" :key="comment._id" class="comment-item">
                                <div class="comment-avatar" @click="goToProfile(comment.author?._id)">
                                    <img src="/default-avatar.svg" alt="avatar" />
                                </div>
                                <div class="comment-body">
                                    <div class="comment-header">
                                        <span class="comment-author" @click="goToProfile(comment.author?._id)">{{ comment.author?.username }}</span>
                                        <span class="comment-username">@{{ comment.author?.username }}</span>
                                        <span class="comment-separator">·</span>
                                        <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                                        
                                        <div v-if="comment.author?._id?.toString() === currentUserId" class="comment-actions">
                                            <button 
                                                v-if="editingCommentId !== comment._id"
                                                class="comment-action-btn" 
                                                @click="startEditingComment(comment)"
                                                title="Edit"
                                            >
                                                <svg viewBox="0 0 24 24" width="16" height="16">
                                                    <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                                </svg>
                                            </button>
                                            <button 
                                                class="comment-action-btn delete" 
                                                @click="confirmDeleteComment(comment._id)"
                                                title="Delete"
                                            >
                                                <svg viewBox="0 0 24 24" width="16" height="16">
                                                    <path fill="currentColor" d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div v-if="editingCommentId === comment._id" class="edit-comment-form">
                                        <textarea v-model="editCommentContent" rows="2" class="edit-comment-input"></textarea>
                                        <div class="edit-comment-actions">
                                            <button class="btn-cancel-sm" @click="cancelEditingComment">Cancel</button>
                                            <button class="btn-save-sm" @click="saveCommentEdit(comment._id)" :disabled="!editCommentContent.trim()">Save</button>
                                        </div>
                                    </div>
                                    
                                    <p v-else class="comment-content">{{ comment.content }}</p>
                                    
                                    <div class="comment-action-bar">
                                        <button class="action-btn-sm">
                                            <svg viewBox="0 0 24 24" width="16" height="16">
                                                <path fill="currentColor" d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/>
                                            </svg>
                                        </button>
                                        <button class="action-btn-sm">
                                            <svg viewBox="0 0 24 24" width="16" height="16">
                                                <path fill="currentColor" d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/>
                                            </svg>
                                        </button>
                                        <button class="action-btn-sm">
                                            <svg viewBox="0 0 24 24" width="16" height="16">
                                                <path fill="currentColor" d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/>
                                            </svg>
                                        </button>
                                        <button class="action-btn-sm">
                                            <svg viewBox="0 0 24 24" width="16" height="16">
                                                <path fill="currentColor" d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <Popup 
            :show="showDeletePostPopup"
            title="Delete Post?"
            message="This can't be undone and it will be removed from your profile, the timeline of any accounts that follow you, and from search results."
            confirmText="Delete"
            cancelText="Cancel"
            type="danger"
            @confirm="deletePost"
            @cancel="showDeletePostPopup = false"
            @close="showDeletePostPopup = false"
        />

        <Popup 
            :show="showDeleteCommentPopup"
            title="Delete Comment?"
            message="This comment will be permanently deleted."
            confirmText="Delete"
            cancelText="Cancel"
            type="danger"
            @confirm="deleteComment"
            @cancel="showDeleteCommentPopup = false"
            @close="showDeleteCommentPopup = false"
        />
    </div>
</template>

<style scoped>
.detail-post {
    display: flex;
    min-height: 100vh;
    background: #fff;
}

.main-content {
    flex: 1;
    margin-left: 275px;
    border-left: 1px solid #e1e8ed;
    border-right: 1px solid #e1e8ed;
}

.container {
    min-height: 100vh;
}

.page-header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 12px 16px;
    border-bottom: 1px solid #e1e8ed;
    position: sticky;
    top: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    z-index: 10;
}

.back-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #14171a;
    transition: background 0.2s;
}

.back-btn:hover {
    background: rgba(0, 0, 0, 0.1);
}

.page-header h2 {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
    color : #14171a;
}

.loading-state,
.error-state {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
    color: #657786;
}

/* Main Post */
.post-main {
    padding: 12px 16px;
    border-bottom: 1px solid #e1e8ed;
}

.post-author {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    cursor: pointer;
}

.avatar:hover {
    opacity: 0.8;
}

.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.author-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.display-name {
    font-weight: 700;
    color: #14171a;
    font-size: 15px;
    cursor: pointer;
}

.display-name:hover {
    text-decoration: underline;
}

.username {
    color: #657786;
    font-size: 15px;
}

.author-actions {
    display: flex;
    gap: 4px;
}

.author-actions .action-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #657786;
    transition: all 0.2s;
}

.author-actions .edit-btn:hover {
    background: rgba(29, 161, 242, 0.1);
    color: #1da1f2;
}

.author-actions .delete-btn:hover {
    background: rgba(224, 36, 94, 0.1);
    color: #e0245e;
}

/* Post Content */
.post-content {
    margin-bottom: 12px;
}

.post-title {
    font-size: 23px;
    font-weight: 700;
    color: #14171a;
    margin: 0 0 8px 0;
    line-height: 1.3;
}

.post-caption {
    font-size: 17px;
    color: #14171a;
    line-height: 1.5;
    margin: 0;
    white-space: pre-wrap;
}

.post-image {
    margin: 12px 0;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #e1e8ed;
}

.post-image img {
    width: 100%;
    max-height: 500px;
    object-fit: cover;
    display: block;
}

.post-meta {
    padding: 16px 0;
    border-bottom: 1px solid #e1e8ed;
    color: #657786;
    font-size: 15px;
}

.edited-badge {
    color: #657786;
}

.post-stats {
    display: flex;
    gap: 20px;
    padding: 16px 0;
    border-bottom: 1px solid #e1e8ed;
}

.stat {
    display: flex;
    gap: 4px;
}

.stat-value {
    font-weight: 700;
    color: #14171a;
}

.stat-label {
    color: #657786;
}

.post-actions {
    display: flex;
    justify-content: space-around;
    padding: 8px 0;
    border-bottom: 1px solid #e1e8ed;
}

.post-actions .action-btn {
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #657786;
    transition: all 0.2s;
}

.post-actions .action-btn:hover {
    background: rgba(29, 161, 242, 0.1);
    color: #1da1f2;
}

/* Edit Form */
.edit-form {
    padding: 12px 0;
}

.edit-title {
    width: 100%;
    padding: 12px;
    font-size: 20px;
    font-weight: 700;
    border: 1px solid #e1e8ed;
    border-radius: 8px;
    margin-bottom: 12px;
    outline: none;
}

.edit-title:focus {
    border-color: #1da1f2;
}

.edit-caption {
    width: 100%;
    padding: 12px;
    font-size: 17px;
    border: 1px solid #e1e8ed;
    border-radius: 8px;
    resize: none;
    outline: none;
    font-family: inherit;
}

.edit-caption:focus {
    border-color: #1da1f2;
}

.markdown-hint {
    margin: 8px 0 0 0;
    font-size: 12px;
    color: #657786;
}

.edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 12px;
}

.btn-cancel {
    padding: 8px 16px;
    border: 1px solid #e1e8ed;
    background: transparent;
    border-radius: 9999px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-cancel:hover {
    background: rgba(0, 0, 0, 0.05);
}

.btn-save {
    padding: 8px 16px;
    border: none;
    background: #1da1f2;
    color: #fff;
    border-radius: 9999px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-save:hover:not(:disabled) {
    background: #1a91da;
}

.btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.reply-composer {
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid #e1e8ed;
}

.composer-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
}

.composer-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.composer-input-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.composer-input {
    width: 100%;
    padding: 12px 0;
    font-size: 17px;
    border: none;
    outline: none;
    resize: none;
    font-family: inherit;
}

.composer-input::placeholder {
    color: #657786;
}

.btn-reply {
    align-self: flex-end;
    padding: 8px 16px;
    border: none;
    background: #1da1f2;
    color: #fff;
    border-radius: 9999px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-reply:hover:not(:disabled) {
    background: #1a91da;
}

.btn-reply:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Comments Section */
.comments-section {
    min-height: 200px;
}

.no-comments {
    display: flex;
    justify-content: center;
    padding: 40px;
    color: #657786;
}

.comment-item {
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid #e1e8ed;
    transition: background 0.2s;
}

.comment-item:hover {
    background: #f5f8fa;
}

.comment-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    cursor: pointer;
}

.comment-avatar:hover {
    opacity: 0.8;
}

.comment-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.comment-body {
    flex: 1;
    min-width: 0;
}

.comment-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 4px;
}

.comment-author {
    font-weight: 700;
    color: #14171a;
    font-size: 15px;
    cursor: pointer;
}

.comment-author:hover {
    text-decoration: underline;
}

.comment-username {
    color: #657786;
    font-size: 15px;
}

.comment-separator {
    color: #657786;
}

.comment-time {
    color: #657786;
    font-size: 15px;
}

.comment-actions {
    margin-left: auto;
    display: flex;
    gap: 4px;
}

.comment-action-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #657786;
    transition: all 0.2s;
}

.comment-action-btn:hover {
    background: rgba(29, 161, 242, 0.1);
    color: #1da1f2;
}

.comment-action-btn.delete:hover {
    background: rgba(224, 36, 94, 0.1);
    color: #e0245e;
}

.comment-content {
    font-size: 15px;
    color: #14171a;
    line-height: 1.4;
    margin: 0 0 8px 0;
    white-space: pre-wrap;
}

.comment-action-bar {
    display: flex;
    gap: 24px;
    margin-top: 8px;
}

.action-btn-sm {
    display: flex;
    align-items: center;
    padding: 4px;
    border: none;
    background: transparent;
    color: #657786;
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.2s;
}

.action-btn-sm:hover {
    background: rgba(29, 161, 242, 0.1);
    color: #1da1f2;
}

.edit-comment-form {
    margin: 8px 0;
}

.edit-comment-input {
    width: 100%;
    padding: 8px;
    font-size: 15px;
    border: 1px solid #1da1f2;
    border-radius: 8px;
    resize: none;
    outline: none;
    font-family: inherit;
}

.edit-comment-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
}

.btn-cancel-sm,
.btn-save-sm {
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}

.btn-cancel-sm {
    border: 1px solid #e1e8ed;
    background: transparent;
}

.btn-cancel-sm:hover {
    background: rgba(0, 0, 0, 0.05);
}

.btn-save-sm {
    border: none;
    background: #1da1f2;
    color: #fff;
}

.btn-save-sm:hover:not(:disabled) {
    background: #1a91da;
}

.btn-save-sm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

@media (max-width: 1280px) {
    .main-content {
        margin-left: 88px;
    }
}

@media (max-width: 768px) {
    .main-content {
        margin-left: 0;
        margin-bottom: 60px;
        max-width: 100%;
        border-left: none;
        border-right: none;
    }
    
    .post-title {
        font-size: 20px;
    }
    
    .post-caption {
        font-size: 16px;
    }
    
    .post-stats {
        flex-wrap: wrap;
    }
    
    .reply-composer {
        padding: 12px;
    }
    
    .composer-avatar {
        width: 40px;
        height: 40px;
    }
}

@media (max-width: 480px) {
    .page-header {
        padding: 10px 12px;
        gap: 16px;
    }
    
    .page-header h2 {
        font-size: 18px;
    }
    
    .post-main {
        padding: 12px;
    }
    
    .avatar {
        width: 40px;
        height: 40px;
    }
    
    .comment-avatar {
        width: 32px;
        height: 32px;
    }
    
    .comment-item {
        padding: 10px 12px;
    }
    
    .comment-action-bar {
        gap: 16px;
    }
}

.markdown-content {
    font-size: 17px;
    color: #14171a;
    line-height: 1.6;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
}

.markdown-content :deep(h1) { font-size: 1.5em; }
.markdown-content :deep(h2) { font-size: 1.3em; }
.markdown-content :deep(h3) { font-size: 1.15em; }
.markdown-content :deep(h4) { font-size: 1em; }

.markdown-content :deep(p) {
    margin-top: 0;
    margin-bottom: 16px;
}

.markdown-content :deep(code) {
    background-color: rgba(27, 31, 35, 0.05);
    border-radius: 6px;
    font-size: 85%;
    padding: 0.2em 0.4em;
    font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
}

.markdown-content :deep(pre) {
    background-color: #0d1117;
    border-radius: 8px;
    font-size: 85%;
    line-height: 1.45;
    overflow-x: auto;
    padding: 16px;
    margin: 16px 0;
}

.markdown-content :deep(pre code) {
    background-color: transparent;
    border: 0;
    display: inline;
    font-size: 100%;
    padding: 0;
    color: #e6edf3;
}

.markdown-content :deep(blockquote) {
    border-left: 4px solid #1da1f2;
    color: #657786;
    margin: 16px 0;
    padding: 0 16px;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
    padding-left: 2em;
    margin-top: 0;
    margin-bottom: 16px;
}

.markdown-content :deep(li) {
    margin-top: 4px;
}

.markdown-content :deep(a) {
    color: #1da1f2;
    text-decoration: none;
}

.markdown-content :deep(a:hover) {
    text-decoration: underline;
}

.markdown-content :deep(hr) {
    background-color: #e1e8ed;
    border: 0;
    height: 1px;
    margin: 24px 0;
}

.markdown-content :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
}

.markdown-content :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
    border: 1px solid #e1e8ed;
    padding: 8px 12px;
    text-align: left;
}

.markdown-content :deep(th) {
    background-color: #f7f8fa;
    font-weight: 600;
}

.markdown-content :deep(strong) {
    font-weight: 600;
}

.markdown-content :deep(em) {
    font-style: italic;
}
</style>
