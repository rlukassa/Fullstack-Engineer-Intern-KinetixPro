<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Sidebar from '../components/Sidebar.component.vue';
import Card, { type Post } from '../components/Card.component.vue';
import api from '../services/api';
import { authService } from '../services/auth';

const route = useRoute();
const router = useRouter();

const user = ref<any>(null);
const posts = ref<Post[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref('tweets');

const userId = computed(() => route.params.id as string);
const isOwnProfile = computed(() => userId.value === authService.getUserId());

const fetchUserProfile = async () => {
  try {
    loading.value = true;
    const response = await api.get(`/users/${userId.value}`);
    user.value = response.data.user;
  } catch (err: any) {
    error.value = 'Failed to load user profile';
    console.error(err);
  }
};

const fetchUserPosts = async () => {
  try {
    const response = await api.get(`/posts/user/${userId.value}`);
    posts.value = response.data.posts;
  } catch (err: any) {
    console.error('Failed to load posts:', err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

onMounted(async () => {
  await fetchUserProfile();
  await fetchUserPosts();
});
</script>

<template>
  <div class="profile">
    <Sidebar />
    
    <main class="main-content">
      <div class="container">
        <div v-if="loading" class="loading-state">
          <span>Loading profile...</span>
        </div>

        <div v-else-if="error || !user" class="error-state">
          <span>{{ error || 'User not found' }}</span>
        </div>

        <div v-else class="profile-content">
          <div class="profile-header">
            <button class="back-btn" @click="router.push('/')">
              <i class="fa-solid fa-circle-xmark"></i>
            </button>
            <div class="header-info">
              <h2>{{ user.username }}</h2>
              <span class="tweet-count">{{ posts.length }} {{ posts.length === 1 ? 'Tweet' : 'Tweets' }}</span>
            </div>
          </div>

          <!-- Banner -->
          <div class="profile-banner"></div>

          <!-- Profile Info -->
          <div class="profile-info-section">
            <div class="avatar-container">
              <img :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`" :alt="user.username" class="profile-avatar" />
            </div>

            <div class="profile-actions">
              <button v-if="!isOwnProfile" class="btn-follow">
                <i class="fas fa-envelope"></i>
              </button>
              <button class="btn-follow-primary">
                {{ isOwnProfile ? 'Edit profile' : 'Follow' }}
              </button>
            </div>

            <div class="profile-details">
              <div class="profile-name">
                <h1>{{ user.username }}</h1>
                <i class="fas fa-check-circle verified-badge"></i>
              </div>
              <span class="profile-username">@{{ user.username }}</span>

              <p class="profile-bio">
                The 'Build In Public' Guy, no-code builder, community creator, podcaster and a new dad 🧸
              </p>

              <div class="profile-meta">
                <span class="meta-item">
                  <i class="fas fa-map-marker-alt"></i>
                  Atlanta
                </span>
                <span class="meta-item">
                  <i class="fas fa-link"></i>
                  <a href="#" class="meta-link">Website</a>
                </span>
                <span class="meta-item">
                  <i class="fas fa-calendar-alt"></i>
                  Joined {{ formatDate(user.created_at) }}
                </span>
              </div>

              <div class="profile-stats">
                <a href="#" class="stat-item">
                  <strong>2</strong> <span>Following</span>
                </a>
                <a href="#" class="stat-item">
                  <strong>855</strong> <span>Followers</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="profile-tabs">
            <button 
              class="tab-item" 
              :class="{ active: activeTab === 'tweets' }"
              @click="activeTab = 'tweets'"
            >
              Posts
            </button>
            <button 
              class="tab-item"
              :class="{ active: activeTab === 'replies' }"
              @click="activeTab = 'replies'"
            >
              Posts & replies
            </button>
            <button 
              class="tab-item"
              :class="{ active: activeTab === 'media' }"
              @click="activeTab = 'media'"
            >
              Media
            </button>
            <button 
              class="tab-item"
              :class="{ active: activeTab === 'likes' }"
              @click="activeTab = 'likes'"
            >
              Likes
            </button>
          </div>

          <!-- Posts List -->
          <div class="posts-list">
            <Card v-for="post in posts" :key="post._id" :post="post" />
          </div>

          <!-- Empty State -->
          <div v-if="posts.length === 0" class="empty-state">
            <p>No tweets yet</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.profile {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
}

.main-content {
  margin-left: 275px;
  flex: 1;
  transition: margin-left 0.3s ease;
}

.container {
  margin: 0 auto;
  background: white;
  min-height: 100vh;
  border-left: 1px solid #e1e8ed;
  border-right: 1px solid #e1e8ed;
}

/* Header */
.profile-header {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 12px 16px;
  border-bottom: 1px solid #e1e8ed;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(29, 161, 242, 0.1);
}

.back-btn i {
  font-size: 18px;
  color: #14171a;
}

.header-info h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #14171a;
}

.tweet-count {
  font-size: 13px;
  color: #657786;
}

/* Banner */
.profile-banner {
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #1da1f2 0%, #0c85d0 100%);
}

/* Profile Info */
.profile-info-section {
  padding: 0 16px;
  position: relative;
}

.avatar-container {
  margin-top: -75px;
  margin-bottom: 12px;
}

.profile-avatar {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 5px solid white;
  background: white;
}

.profile-actions {
  position: absolute;
  top: 12px;
  right: 16px;
  display: flex;
  gap: 8px;
}

.btn-follow {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #cfd9de;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-follow:hover {
  background: rgba(0, 0, 0, 0.03);
}

.btn-follow i {
  color: #14171a;
}

.btn-follow-primary {
  padding: 8px 24px;
  border-radius: 50px;
  border: 1px solid #1da1f2;
  background: white;
  color: #1da1f2;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-follow-primary:hover {
  background: rgba(29, 161, 242, 0.1);
}

.profile-details {
  margin-top: 12px;
}

.profile-name {
  display: flex;
  align-items: center;
  gap: 6px;
}

.profile-name h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #14171a;
}

.verified-badge {
  color: #1da1f2;
  font-size: 18px;
}

.profile-username {
  color: #657786;
  font-size: 15px;
}

.profile-bio {
  margin: 12px 0;
  color: #14171a;
  font-size: 15px;
  line-height: 1.5;
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 12px 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #657786;
  font-size: 15px;
}

.meta-item i {
  font-size: 14px;
}

.meta-link {
  color: #1da1f2;
  text-decoration: none;
}

.meta-link:hover {
  text-decoration: underline;
}

.profile-stats {
  display: flex;
  gap: 20px;
  margin: 12px 0 16px;
}

.stat-item {
  display: flex;
  gap: 4px;
  text-decoration: none;
  color: #14171a;
  font-size: 15px;
  transition: text-decoration 0.2s;
}

.stat-item:hover span {
  text-decoration: underline;
}

.stat-item strong {
  font-weight: 700;
}

.stat-item span {
  color: #657786;
}

/* Tabs */
.profile-tabs {
  display: flex;
  border-bottom: 1px solid #e1e8ed;
}

.tab-item {
  flex: 1;
  padding: 16px;
  border: none;
  background: transparent;
  color: #657786;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.tab-item:hover {
  background: rgba(29, 161, 242, 0.1);
  color: #1da1f2;
}

.tab-item.active {
  color: #14171a;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: #1da1f2;
  border-radius: 2px;
}

/* Posts List */
.posts-list {
  background: white;
}

/* States */
.loading-state,
.error-state,
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #657786;
  font-size: 15px;
}

/* Responsive Design */
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
  
  .profile-banner {
    height: 150px;
  }
  
  .profile-avatar {
    width: 100px;
    height: 100px;
    margin-top: -50px;
    border-width: 3px;
  }
  
  .profile-name {
    font-size: 18px;
  }
  
  .profile-stats {
    gap: 16px;
  }
  
  .profile-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .tab-item {
    padding: 16px 12px;
    font-size: 14px;
    white-space: nowrap;
  }
}

@media (max-width: 480px) {
  .profile-header {
    padding: 10px 12px;
    gap: 16px;
  }
  
  .profile-info-section {
    padding: 12px;
  }
  
  .profile-actions {
    gap: 8px;
  }
  
  .btn-follow,
  .btn-follow-primary {
    padding: 6px 14px;
    font-size: 13px;
  }
  
  .profile-meta {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
