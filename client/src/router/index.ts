import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import DetailPost from '../views/DetailPost.vue';
import ProfileView from '../views/ProfileView.vue';
import BookmarksView from '../views/BookmarksView.vue';
import NotificationsView from '../views/NotificationsView.vue';
import MessagesView from '../views/MessagesView.vue';
import { authService } from '../services/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/post/:id',
      name: 'detail',
      component: DetailPost,
      meta: { requiresAuth: true }
    },
    {
      path: '/profile/:id',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/bookmarks',
      name: 'bookmarks',
      component: BookmarksView,
      meta: { requiresAuth: true }
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: NotificationsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/messages',
      name: 'messages',
      component: MessagesView,
      meta: { requiresAuth: true }
    }
  ]
});

// Navigation guard untuk proteksi route
router.beforeEach((to, from, next) => {
  const isAuthenticated = authService.isAuthenticated();
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Redirect ke login jika belum login
    next({ name: 'login' });
  } else if (to.name === 'login' && isAuthenticated) {
    // Redirect ke home jika sudah login dan coba akses login page
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router;
