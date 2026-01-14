<script setup lang="ts"> 
import { ref, watch } from 'vue'; 
import { useRouter, useRoute } from 'vue-router';
import { authService } from '../services/auth';
import Popup from './Popup.component.vue';

const router = useRouter();
const route = useRoute();
const isCollapsed = ref(false); 
const showMoreMenu = ref(false);
const showDeletePopup = ref(false);

const menuItems = [
  { id: 'home', label: 'Home', icon: 'fa-solid fa-circle-user', route: '/' },
  { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell', route: '/notifications' },
  { id: 'messages', label: 'Messages', icon: 'fas fa-envelope', route: '/messages', badge: 1 },
  { id: 'bookmarks', label: 'Bookmarks', icon: 'fas fa-bookmark', route: '/bookmarks' },
  { id: 'profile', label: 'Profile', icon: 'fas fa-user', route: '/profile' },
  { id: 'more', label: 'More', icon: 'fa-brands fa-stack-overflow', route: '#' },
];

// Function to get active item from path
const getActiveFromPath = (path: string): string => {
  if (path === '/') return 'home';
  if (path.startsWith('/notifications')) return 'notifications';
  if (path.startsWith('/messages')) return 'messages';
  if (path.startsWith('/bookmarks')) return 'bookmarks';
  if (path.startsWith('/profile')) return 'profile';
  if (path.startsWith('/post')) return 'home';
  return 'home';
};

// Use ref instead of computed for immediate updates
const activeItem = ref(getActiveFromPath(route.path));

// Watch route changes
watch(() => route.path, (newPath) => {
  activeItem.value = getActiveFromPath(newPath);
}, { immediate: true });

const toggleSidebar = () => { 
  isCollapsed.value = !isCollapsed.value; 
};

const handleMenuClick = (item: typeof menuItems[0]) => { 
  if (item.id === 'more') {
    showMoreMenu.value = !showMoreMenu.value;
    return;
  }
  
  // Set active immediately on click
  activeItem.value = item.id;
  
  if (item.id === 'profile') {
    const userId = authService.getUserId();
    if (userId) {
      router.push(`/profile/${userId}`);
    }
    return;
  }
  
  if (item.id === 'bookmarks') {
    router.push('/bookmarks');
    return;
  }
  
  if (item.id === 'notifications') {
    router.push('/notifications');
    return;
  }
  
  if (item.id === 'messages') {
    router.push('/messages');
    return;
  }
  
  if (item.route !== '#') {
    router.push(item.route);
  }
};

const handleLogout = () => {
  authService.logout();
  router.push('/login');
};

const handleDeleteAccount = async () => {
  showDeletePopup.value = true;
};

const confirmDeleteAccount = async () => {
  authService.logout();
  router.push('/login');
};

const handleTweet = () => {
  console.log('Create new post');
};
</script> 

<template> 
  <div class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed }">
    <div class="sidebar-header">
      <div class="logo-container">
        <img src="@/assets/kinetix-logo-red.svg" alt="KinetixPro" class="logo-icon" />
      </div>
    </div>

    <nav class="sidebar-nav">
      <ul class="sidebar-menu">
        <li 
          v-for="item in menuItems" 
          :key="item.id"
          class="menu-item"
          :class="{ 'active': activeItem === item.id }"
          @click="handleMenuClick(item)"
        >
          <a href="#" @click.prevent>
            <span class="icon-wrapper">
              <i :class="item.icon"></i>
              <span v-if="item.badge" class="badge">{{ item.badge }}</span>
            </span>
            <span v-if="!isCollapsed" class="menu-label">{{ item.label }}</span>
          </a>
          
          <!-- More Dropdown Menu -->
          <div v-if="item.id === 'more' && showMoreMenu" class="more-dropdown">
            <button class="dropdown-item" @click.stop="handleLogout">
              <i class="fa-solid fa-circle-xmark"></i>              <span>Logout</span>
            </button>
            <button class="dropdown-item danger" @click.stop="handleDeleteAccount">
              <i class="fas fa-trash-alt"></i>
              <span>Delete Account</span>
            </button>
          </div>
        </li>
      </ul>
    </nav>

    <div class="tweet-section">
      <button class="btn-tweet" @click="handleTweet">
        <i v-if="isCollapsed" class="fas fa-feather-alt"></i>
        <span v-else>Post!</span>
      </button>
    </div>

    <div class="sidebar-footer">
      <a href="#" class="footer-link">Get our free guide to no-code</a>
    </div>

    <Popup 
      :show="showDeletePopup"
      title="Delete Account"
      message="Are you sure you want to delete your account? This action cannot be undone."
      type="danger"
      confirm-text="Delete"
      cancel-text="Cancel"
      @confirm="confirmDeleteAccount"
      @close="showDeletePopup = false"
    />
  </div>
</template>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 275px;
  background: #ffffff;
  border-right: 1px solid #eff3f4;
  display: flex;
  flex-direction: column;
  padding: 12px;
  transition: width 0.3s ease;
  z-index: 100;
}

.sidebar-collapsed {
  width: 88px;
}

.sidebar-header {
  padding: 4px 12px;
  margin-bottom: 8px;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 8px 0;
}

.logo-icon {
  width: 140px;
  height: 115px;
}

.sidebar-nav {
  flex: 1;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  margin-bottom: 4px;
}

.menu-item a {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 50px;
  text-decoration: none;
  color: #0f1419;
  font-size: 20px;
  font-weight: 400;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.menu-item a:hover {
  background-color: rgba(29, 155, 240, 0.1);
  color: #1d9bf0;
}

.menu-item.active a {
  color: #1d9bf0;
  font-weight: 700;
  background-color: rgba(29, 155, 240, 0.1);
  border: 2px solid #616060;
  animation: pulse 0.3s ease;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.98);
  }
  100% {
    transform: scale(1);
  }
}

.icon-wrapper {
  position: relative;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrapper i {
  font-size: 24px;
  transition: transform 0.2s ease;
}

.menu-item a:hover .icon-wrapper i {
  transform: scale(1.1);
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #1d9bf0;
  color: white;
  font-size: 11px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-label {
  margin-left: 20px;
  white-space: nowrap;
}

.tweet-section {
  padding: 16px 12px;
}

.btn-tweet {
  width: 100%;
  padding: 16px 32px;
  background: #1d9bf0;
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(29, 155, 240, 0.3);
}

.btn-tweet:hover {
  background: #1a8cd8;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(29, 155, 240, 0.4);
}

.btn-tweet:active {
  transform: translateY(0);
}

.sidebar-collapsed .btn-tweet {
  width: 50px;
  height: 50px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-collapsed .btn-tweet i {
  font-size: 20px;
}

/* Footer */
.sidebar-footer {
  padding: 16px 12px;
  text-align: center;
}

.footer-link {
  color: #1d9bf0;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-link:hover {
  text-decoration: underline;
}

.sidebar-collapsed .footer-link {
  display: none;
}

.sidebar-collapsed .menu-label {
  display: none;
}

/* More Dropdown Menu */
.more-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  background: white;
  border: 1px solid #eff3f4;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  margin-bottom: 8px;
  padding: 12px 0;
  min-width: 220px;
  z-index: 1000;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 12px 20px;
  background: none;
  border: none;
  text-align: left;
  font-size: 15px;
  font-weight: 600;
  color: #0f1419;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: rgba(29, 155, 240, 0.1);
}

.dropdown-item i {
  font-size: 18px;
  width: 20px;
  text-align: center;
}

.dropdown-item.danger {
  color: #f4212e;
}

.dropdown-item.danger:hover {
  background-color: rgba(244, 33, 46, 0.1);
}

.menu-item {
  position: relative;
}

/* Responsive Design */
@media (max-width: 1280px) {
  .sidebar {
    width: 88px;
  }
  
  .menu-label,
  .btn-tweet span,
  .sidebar-footer {
    display: none;
  }
  
  .btn-tweet {
    width: 50px;
    height: 50px;
    padding: 0;
    border-radius: 50%;
  }
  
  .btn-tweet i {
    display: block;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: fixed;
    bottom: 0;
    top: auto;
    left: 0;
    right: 0;
    flex-direction: row;
    padding: 8px 0;
    border-right: none;
    border-top: 1px solid #eff3f4;
    background: #fff;
  }
  
  .sidebar-header,
  .sidebar-footer,
  .tweet-section {
    display: none;
  }
  
  .sidebar-nav {
    width: 100%;
  }
  
  .sidebar-menu {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
  
  .menu-item {
    margin-bottom: 0;
  }
  
  .menu-item a {
    padding: 12px 16px;
  }
  
  .menu-label {
    display: none;
  }
  
  .more-dropdown {
    bottom: 100%;
    top: auto;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
