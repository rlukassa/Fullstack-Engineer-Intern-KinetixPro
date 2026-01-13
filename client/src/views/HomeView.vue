<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/auth';
import Sidebar from '../components/Sidebar.component.vue';
import TweetComposer from '../components/Post.component.vue';
import Card, { type Post } from '../components/Card.component.vue';
import api from '../services/api';

const router = useRouter();
const posts = ref<Post[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const submitting = ref(false);

const searchQuery = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const totalPosts = ref(0);
const postsPerPage = ref(10);
const hasNextPage = ref(false);
const hasPrevPage = ref(false);
const searchTimeout = ref<number | null>(null);

const handleLogout = () => {
  authService.logout();
  router.push('/login');
};

const handleNewPost = async (postData: { title: string; caption: string; imageUrl: string; imageFile: File | null }) => {
  if (submitting.value) return;
  
  try {
    submitting.value = true;
    const userId = authService.getUserId();
    
    if (!userId) {
      alert('Please login first');
      router.push('/login');
      return;
    }

    const payload = {
      title: postData.title,
      caption: postData.caption,
      image: postData.imageUrl || null,
      authorId: parseInt(userId)
    };

    const response = await api.post('/posts', payload);
    
    if (response.data.post) {
      currentPage.value = 1;
      await fetchPosts();
      console.log('Post created successfully!');
    }
  } catch (err: any) {
    console.error('Failed to create post:', err);
    alert(err.response?.data?.message || 'Failed to create post');
  } finally {
    submitting.value = false;
  }
};

const fetchPosts = async () => {
  try {
    loading.value = true;
    const params = new URLSearchParams();
    params.append('page', currentPage.value.toString());
    params.append('limit', postsPerPage.value.toString());
    if (searchQuery.value.trim()) {
      params.append('search', searchQuery.value.trim());
    }
    
    const userId = authService.getUserId();
    if (userId) {
      params.append('userId', userId);
    }
    
    const response = await api.get(`/posts?${params.toString()}`);
    posts.value = response.data.posts;
    
    if (response.data.pagination) {
      totalPages.value = response.data.pagination.totalPages;
      totalPosts.value = response.data.pagination.totalPosts;
      hasNextPage.value = response.data.pagination.hasNextPage;
      hasPrevPage.value = response.data.pagination.hasPrevPage;
    }
  } catch (err) {
    error.value = 'Failed to load posts';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  searchTimeout.value = setTimeout(() => {
    currentPage.value = 1;
    fetchPosts();
  }, 300) as unknown as number;
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const nextPage = () => {
  if (hasNextPage.value) {
    goToPage(currentPage.value + 1);
  }
};

const prevPage = () => {
  if (hasPrevPage.value) {
    goToPage(currentPage.value - 1);
  }
};

onMounted(() => {
  fetchPosts();
});
</script>

<template> 
    <div class="home">
      <Sidebar />
      
      <main class="main-content">
        <div class="container">
          <div class="header">
            <h2>Home</h2>
            <p class="subtitle">@{{ authService.getUsername() || 'user' }}</p>
          </div>

          <div class="search-bar">
            <div class="search-input-wrapper">
              <svg viewBox="0 0 24 24" class="search-icon" width="20" height="20">
                <path fill="currentColor" d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z"/>
              </svg>
              <input 
                v-model="searchQuery"
                @input="handleSearch"
                type="text" 
                placeholder="Search posts by title or content..."
                class="search-input"
              />
              <button 
                v-if="searchQuery" 
                @click="searchQuery = ''; handleSearch()"
                class="clear-search"
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M12 10.586l4.95-4.95 1.414 1.414L13.414 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12l-4.95-4.95 1.414-1.414L12 10.586z"/>
                </svg>
              </button>
            </div>
            <div v-if="searchQuery && !loading" class="search-results-info">
              Found {{ totalPosts }} {{ totalPosts === 1 ? 'post' : 'posts' }} matching "{{ searchQuery }}"
            </div>
          </div>

          <TweetComposer @post="handleNewPost" />

          <div v-if="loading" class="loading-state">
            <span>Loading posts...</span>
          </div>

          <div v-else-if="error" class="error-state">
            <span>{{ error }}</span>
          </div>

          <div v-else-if="posts.length > 0" class="posts-list">
            <Card v-for="post in posts" :key="post._id" :post="post" />
          </div>

          <div v-else class="empty-state">
            <p v-if="searchQuery">No posts found matching "{{ searchQuery }}"</p>
            <p v-else>No posts available at the moment.</p>
          </div>

          <div v-if="!loading && posts.length > 0 && totalPages > 1" class="pagination">
            <button 
              class="pagination-btn" 
              :disabled="!hasPrevPage"
              @click="prevPage"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"/>
              </svg>
              Previous
            </button>
            
            <div class="pagination-info">
              <span class="page-numbers">
                <button 
                  v-for="page in Math.min(5, totalPages)" 
                  :key="page"
                  class="page-btn"
                  :class="{ active: currentPage === page }"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </button>
                <span v-if="totalPages > 5" class="ellipsis">...</span>
                <button 
                  v-if="totalPages > 5"
                  class="page-btn"
                  :class="{ active: currentPage === totalPages }"
                  @click="goToPage(totalPages)"
                >
                  {{ totalPages }}
                </button>
              </span>
            </div>
            
            <button 
              class="pagination-btn" 
              :disabled="!hasNextPage"
              @click="nextPage"
            >
              Next
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M16.586 11l-5.043-5.04 1.414-1.42L20.414 12l-7.457 7.46-1.414-1.42L16.586 13H3v-2h13.586z"/>
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f8fa;
  display: flex;
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

.posts-list {
  border-top: 1px solid #e1e8ed;
}

.loading-state, .error-state {
  text-align: center;
  padding: 40px;
  color: #536471;
}

.error-state {
  color: #f4212e;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #536471;
  font-size: 16px;
}

.empty-state i {
  font-size: 48px;
  color: #cfd9de;
  margin-bottom: 16px;
}

/* Search Bar */
.search-bar {
  padding: 12px 16px;
  border-bottom: 1px solid #e1e8ed;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: #eff3f4;
  border-radius: 9999px;
  padding: 12px 16px;
  gap: 12px;
  transition: all 0.2s;
}

.search-input-wrapper:focus-within {
  background: #fff;
  box-shadow: 0 0 0 2px #1da1f2;
}

.search-icon {
  color: #536471;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #0f1419;
  outline: none;
}

.search-input::placeholder {
  color: #536471;
}

.clear-search {
  border: none;
  background: transparent;
  color: #536471;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.clear-search:hover {
  background: rgba(29, 155, 240, 0.1);
  color: #1da1f2;
}

.search-results-info {
  margin-top: 12px;
  font-size: 14px;
  color: #536471;
  text-align: center;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 20px;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid #cfd9de;
  background: #fff;
  color: #0f1419;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f7f9fa;
  border-color: #1da1f2;
  color: #1da1f2;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #cfd9de;
  background: #fff;
  color: #0f1419;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover {
  background: #f7f9fa;
  border-color: #1da1f2;
}

.page-btn.active {
  background: #1da1f2;
  border-color: #1da1f2;
  color: #fff;
}

.ellipsis {
  color: #536471;
  padding: 0 4px;
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
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .pagination-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
  
  .page-numbers {
    order: -1;
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 16px 12px;
  }
  
  .header {
    margin-bottom: 24px;
  }
  
  .search-input-wrapper {
    padding: 10px 14px;
  }
  
  .pagination-btn span {
    display: none;
  }
}
</style>
