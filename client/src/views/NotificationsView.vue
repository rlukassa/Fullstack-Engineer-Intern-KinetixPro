<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/auth';
import Sidebar from '../components/Sidebar.component.vue';
import api from '../services/api';

interface Notification {
  _id: number;
  type: 'like' | 'bookmark' | 'comment';
  isRead: boolean;
  createdAt: string;
  actor: {
    _id: number;
    username: string;
  };
  post: {
    _id: number;
    title: string;
    caption: string;
  };
}

const router = useRouter();
const notifications = ref<Notification[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchNotifications = async () => {
  try {
    loading.value = true;
    const userId = authService.getUserId();
    
    if (!userId) {
      router.push('/login');
      return;
    }
    
    const response = await api.get(`/notifications/${userId}`);
    notifications.value = response.data.notifications;
  } catch (err) {
    error.value = 'Failed to load notifications';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const markAllAsRead = async () => {
  try {
    const userId = authService.getUserId();
    if (!userId) return;
    
    await api.put(`/notifications/${userId}/read-all`);
    notifications.value = notifications.value.map(n => ({ ...n, isRead: true }));
  } catch (err) {
    console.error('Failed to mark all as read:', err);
  }
};

const goToPost = async (notification: Notification) => {
  try {
    // Mark as read
    if (!notification.isRead) {
      await api.put(`/notifications/${notification._id}/read`);
      const index = notifications.value.findIndex(n => n._id === notification._id);
      const notif = notifications.value[index];
      if (index !== -1 && notif) {
        notif.isRead = true;
      }
    }
    // Navigate to post
    router.push(`/post/${notification.post._id}`);
  } catch (err) {
    console.error('Error:', err);
    router.push(`/post/${notification.post._id}`);
  }
};

const getNotificationMessage = (notification: Notification): string => {
  const action = {
    like: 'liked your post',
    bookmark: 'bookmarked your post',
    comment: 'commented on your post'
  };
  return action[notification.type] || 'interacted with your post';
};

const getNotificationIcon = (type: string): string => {
  const icons: Record<string, string> = {
    like: 'fas fa-heart',
    bookmark: 'fas fa-bookmark',
    comment: 'fas fa-comment'
  };
  return icons[type] || 'fas fa-bell';
};

const getIconColor = (type: string): string => {
  const colors: Record<string, string> = {
    like: '#e0245e',
    bookmark: '#f5a623',
    comment: '#1da1f2'
  };
  return colors[type] || '#657786';
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const unreadCount = computed(() => 
  notifications.value.filter(n => !n.isRead).length
);

onMounted(() => {
  fetchNotifications();
});
</script>

<template>
  <div class="notifications-page">
    <Sidebar />
    
    <main class="main-content">
      <div class="container">
        <div class="header">
          <div class="header-top">
            <div>
              <h2>Notifications</h2>
              <p class="subtitle">@{{ authService.getUsername() || 'user' }}</p>
            </div>
            <button 
              v-if="unreadCount > 0" 
              @click="markAllAsRead" 
              class="mark-all-btn"
            >
              Mark all as read
            </button>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading notifications...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button @click="fetchNotifications" class="btn-retry">Retry</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="notifications.length === 0" class="empty-state">
          <i class="far fa-bell empty-icon"></i>
          <h3>Nothing to see here — yet</h3>
          <p>When someone likes, bookmarks, or comments on your posts, you'll see it here.</p>
        </div>

        <!-- Notifications List -->
        <div v-else class="notifications-list">
          <div 
            v-for="notification in notifications" 
            :key="notification._id"
            class="notification-item"
            :class="{ unread: !notification.isRead }"
            @click="goToPost(notification)"
          >
            <div class="notification-icon" :style="{ color: getIconColor(notification.type) }">
              <i :class="getNotificationIcon(notification.type)"></i>
            </div>
            
            <div class="notification-content">
              <div class="notification-text">
                <span class="actor-name">{{ notification.actor.username }}</span>
                <span class="action-text">{{ getNotificationMessage(notification) }}</span>
              </div>
              <div class="post-preview">
                <span class="post-title">{{ notification.post.title }}</span>
                <span class="separator">|</span>
                <span class="post-caption">{{ notification.post.caption }}...</span>
              </div>
              <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
            </div>

            <div v-if="!notification.isRead" class="unread-indicator"></div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.notifications-page {
  display: flex;
  min-height: 100vh;
  background: #f5f8fa;
}

.main-content {
  flex: 1;
  margin-left: 275px;
  border-right: 1px solid #e1e8ed;
  background: #fff;
  min-height: 100vh;
}

.container {
  width: 100%;
}

.header {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  padding: 12px 16px;
  border-bottom: 1px solid #e1e8ed;
  z-index: 10;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header h2 {
  font-size: 20px;
  font-weight: 800;
  color: #0f1419;
  margin: 0;
}

.header .subtitle {
  font-size: 13px;
  color: #657786;
  margin: 0;
}

.mark-all-btn {
  background: transparent;
  border: none;
  color: #1da1f2;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 16px;
  transition: background 0.2s;
}

.mark-all-btn:hover {
  background: rgba(29, 161, 242, 0.1);
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e1e8ed;
  border-top-color: #1da1f2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p,
.error-state p {
  color: #657786;
  margin-top: 16px;
}

.btn-retry {
  margin-top: 16px;
  padding: 10px 20px;
  background: #1da1f2;
  color: white;
  border: none;
  border-radius: 50px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-retry:hover {
  background: #1a91da;
}

.empty-state .empty-icon {
  font-size: 48px;
  color: #657786;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 800;
  color: #0f1419;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: #657786;
  margin: 0;
  max-width: 300px;
}

.notifications-list {
  border-top: 1px solid #e1e8ed;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid #e1e8ed;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.notification-item:hover {
  background: #f7f9fa;
}

.notification-item.unread {
  background: rgba(29, 161, 242, 0.03);
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f7f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.notification-icon i {
  font-size: 16px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-text {
  font-size: 15px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.actor-name {
  font-weight: 700;
  color: #0f1419;
}

.action-text {
  color: #657786;
  margin-left: 4px;
}

.post-preview {
  font-size: 14px;
  color: #657786;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-title {
  font-weight: 600;
  color: #0f1419;
}

.separator {
  margin: 0 6px;
  color: #cfd9de;
}

.post-caption {
  color: #657786;
}

.notification-time {
  font-size: 13px;
  color: #657786;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  background: #1da1f2;
  border-radius: 50%;
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

/* Responsive */
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
  }
  
  .notification-item {
    padding: 12px;
  }
  
  .notification-icon {
    width: 36px;
    height: 36px;
  }
}
</style>
