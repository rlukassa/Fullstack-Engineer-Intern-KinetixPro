<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/auth';
import Sidebar from '../components/Sidebar.component.vue';
import Card, { type Post } from '../components/Card.component.vue';
import api from '../services/api';

const router = useRouter();
const posts = ref<Post[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchBookmarks = async () => {
  try {
    loading.value = true;
    const userId = authService.getUserId();
    
    if (!userId) {
      router.push('/login');
      return;
    }
    
    const response = await api.get(`/bookmarks/${userId}`);
    posts.value = response.data.posts;
  } catch (err) {
    error.value = 'Failed to load bookmarks';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchBookmarks();
});
</script>

<template>
  <div class="bookmarks-page">
    <Sidebar />
    
    <main class="main-content">
      <div class="container">
        <div class="header">
          <h2>Bookmarks</h2>
          <p class="subtitle">@{{ authService.getUsername() || 'user' }}</p>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading bookmarks...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button @click="fetchBookmarks" class="btn-retry">Retry</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="posts.length === 0" class="empty-state">
          <i class="far fa-bookmark empty-icon"></i>
          <h3>Save posts for later</h3>
          <p>Bookmark posts to easily find them again in the future.</p>
        </div>

        <!-- Posts List -->
        <div v-else class="posts-list">
          <Card v-for="post in posts" :key="post._id" :post="post" />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.bookmarks-page {
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

.posts-list {
  border-top: 1px solid #e1e8ed;
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
}
</style>
