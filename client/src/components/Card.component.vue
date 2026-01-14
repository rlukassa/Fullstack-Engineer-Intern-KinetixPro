<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { parseMarkdown } from '../utils/markdown';
import { authService } from '../services/auth';
import api from '../services/api';

export interface Post {
    _id: string | number;
    title: string;
    caption: string;
    image?: string;
    likes: number;
    comments: number;
    author: {
        _id: string | number;
        username: string;
    };
    createdAt: string;
    isEdited: boolean;
    isLiked?: boolean;
    isBookmarked?: boolean;
}

const props = defineProps<{
    post: Post;
}>();

const emit = defineEmits(['update:post']);

const router = useRouter();

// Local reactive state for like and bookmark
const isLiked = ref(props.post.isLiked || false);
const isBookmarked = ref(props.post.isBookmarked || false);
const likesCount = ref(props.post.likes);
const isLiking = ref(false);
const isBookmarking = ref(false);

// Truncate markdown content for preview (max 280 characters)
const truncatedCaption = computed(() => {
    const plainText = props.post.caption.replace(/[#*`~\[\]()]/g, '').substring(0, 280);
    return plainText.length < props.post.caption.length ? plainText + '...' : plainText;
});

const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const goToProfile = (userId: string | number) => {
    router.push(`/profile/${userId}`);
};

const goToPost = (postId: string | number) => {
    router.push(`/post/${postId}`);
};

const handleLike = async () => {
    if (isLiking.value) return;
    
    const userId = authService.getUserId();
    if (!userId) {
        router.push('/login');
        return;
    }

    try {
        isLiking.value = true;
        const response = await api.post(`/posts/${props.post._id}/like`, { userId: parseInt(userId) });
        isLiked.value = response.data.isLiked;
        likesCount.value = response.data.likes;
    } catch (error) {
        console.error('Failed to toggle like:', error);
    } finally {
        isLiking.value = false;
    }
};

const handleBookmark = async () => {
    if (isBookmarking.value) return;
    
    const userId = authService.getUserId();
    if (!userId) {
        router.push('/login');
        return;
    }

    try {
        isBookmarking.value = true;
        const response = await api.post(`/posts/${props.post._id}/bookmark`, { userId: parseInt(userId) });
        isBookmarked.value = response.data.isBookmarked;
    } catch (error) {
        console.error('Failed to toggle bookmark:', error);
    } finally {
        isBookmarking.value = false;
    }
};
</script>

<template>
    <div class="card-post" @click="goToPost(post._id)">
        <!-- Header -->
        <div class="post-header">
            <div class="avatar" @click.stop="goToProfile(post.author?._id)">
                <img src="/default-avatar.svg" alt="avatar" />
            </div>
            <div class="user-info">
                <span class="display-name" @click.stop="goToProfile(post.author?._id)">{{ post.author?.username || 'Unknown' }}</span>
                <span class="username" @click.stop="goToProfile(post.author?._id)">@{{ post.author?.username || 'unknown' }}</span>
                <span class="separator">·</span>
                <span class="time">{{ formatTime(post.createdAt) }}</span>
            </div>
        </div>

        <!-- Content -->
        <div class="post-content">
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-caption">{{ truncatedCaption }}</p>
        </div>

        <div v-if="post.image" class="post-image">
            <img :src="post.image" :alt="post.title" />
        </div>

        <div class="post-actions" @click.stop>
            <button class="action-btn comment">
                <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/>
                </svg>
                <span>{{ post.comments || 0 }}</span>
            </button>
            <button class="action-btn like" :class="{ active: isLiked }" @click="handleLike" :disabled="isLiking">
                <i v-if="isLiked" class="fas fa-heart"></i>
                <svg v-else viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/>
                </svg>
                <span>{{ likesCount }}</span>
            </button>
            <button class="action-btn bookmark" :class="{ active: isBookmarked }" @click="handleBookmark" :disabled="isBookmarking">
                <i v-if="isBookmarked" class="fas fa-bookmark"></i>
                <i v-else class="far fa-bookmark"></i>
            </button>
            <button class="action-btn share">
                <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"/>
                </svg>
            </button>
        </div>
    </div>
</template>

<style scoped>
.card-post {
    background: #fff;
    border: 1px solid #e1e8ed;
    border-bottom: none;
    padding: 12px 16px;
    transition: background 0.2s;
    cursor: pointer;
}

.card-post:last-child {
    border-bottom: 1px solid #e1e8ed;
}

.card-post:hover {
    background: #f5f8fa;
}

.post-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    cursor: pointer;
    transition: opacity 0.2s;
}

.avatar:hover {
    opacity: 0.8;
}

.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.user-info {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
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
    cursor: pointer;
}

.username:hover {
    text-decoration: underline;
}

.separator,
.time {
    color: #14171a;
}

.post-content {
    margin: 8px 0 8px 60px;
}

.post-title {
    font-size: 16px;
    font-weight: 600;
    color: #14171a;
    margin: 0 0 4px 0;
}

.post-caption {
    font-size: 15px;
    color: #14171a;
    line-height: 1.4;
    margin: 0;
    white-space: pre-wrap;
}

.post-image {
    margin: 12px 0 12px 60px;
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

.post-actions {
    display: flex;
    margin-left: 60px;
    margin-top: 12px;
    justify-content: space-between;
    max-width: 425px;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: none;
    background: transparent;
    color: #657786;
    cursor: pointer;
    border-radius: 50px;
    font-size: 13px;
    transition: all 0.2s;
}

.action-btn:hover {
    background: rgba(29, 161, 242, 0.1);
}

.action-btn.comment:hover {
    color: #1da1f2;
}

.action-btn.bookmark:hover {
    color: #f5a623;
    background: rgba(245, 166, 35, 0.1);
}

.action-btn.bookmark.active {
    color: #f5a623;
}

.action-btn.bookmark.active i {
    font-size: 18px;
}

.action-btn.like:hover {
    color: #e0245e;
    background: rgba(224, 36, 94, 0.1);
}

.action-btn.like.active {
    color: #e0245e;
}

.action-btn.like.active i {
    font-size: 18px;
}

.action-btn.share:hover {
    color: #1da1f2;
}

.action-btn svg {
    flex-shrink: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
    .card-post {
        padding: 12px;
    }
    
    .avatar {
        width: 40px;
        height: 40px;
    }
    
    .post-content {
        margin-left: 52px;
    }
    
    .post-image {
        margin-left: 52px;
    }
    
    .post-actions {
        margin-left: 52px;
    }
    
    .display-name,
    .username {
        font-size: 14px;
    }
}

@media (max-width: 480px) {
    .post-header {
        gap: 8px;
    }
    
    .avatar {
        width: 36px;
        height: 36px;
    }
    
    .post-content {
        margin-left: 0;
        margin-top: 8px;
    }
    
    .post-image {
        margin-left: 0;
    }
    
    .post-actions {
        margin-left: 0;
        justify-content: space-around;
    }
    
    .action-btn {
        padding: 8px;
    }
    
    .action-btn span {
        display: none;
    }
}
</style>