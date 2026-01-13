<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-section">
        <img src="@/assets/kinetix-logo-red.svg" alt="KinetixPro Logo" class="logo" />
      </div>
      
      <h1 class="login-title">Log in to KinetixPro</h1>
      
      <form @submit.prevent="handleSubmit">
        <div v-if="!isLogin" class="form-group">
          <input 
            type="text" 
            id="username" 
            v-model="formData.username" 
            placeholder="Username"
            required
          />
        </div>

        <div class="form-group">
          <input 
            type="email" 
            id="email" 
            v-model="formData.email" 
            placeholder="Email"
            required
          />
        </div>

        <div class="form-group">
          <input 
            type="password" 
            id="password" 
            v-model="formData.password" 
            placeholder="Password"
            required
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Loading...' : (isLogin ? 'Log in' : 'Sign up') }}
        </button>
      </form>

      <div class="toggle-mode">
        <span v-if="isLogin">
          Don't have an account? 
          <a @click="toggleMode" href="#">Sign up for KinetixPro</a>
        </span>
        <span v-else>
          Already have an account? 
          <a @click="toggleMode" href="#">Log in</a>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/auth';

const router = useRouter();
const isLogin = ref(true);
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const formData = ref({
  username: '',
  email: '',
  password: ''
});

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  errorMessage.value = '';
  successMessage.value = '';
  formData.value = {
    username: '',
    email: '',
    password: ''
  };
};

const handleSubmit = async () => {
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    let result;
    
    if (isLogin.value) {
      result = await authService.login(formData.value.email, formData.value.password);
    } else {
      result = await authService.register(
        formData.value.username,
        formData.value.email,
        formData.value.password
      );
    }

    if (result.success) {
      if (isLogin.value) {
        successMessage.value = 'Login successful!';
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        successMessage.value = 'Registration successful! Please login.';
        setTimeout(() => {
          isLogin.value = true;
          formData.value.username = '';
          formData.value.password = '';
          successMessage.value = '';
        }, 1500);
      }
    } else {
      errorMessage.value = result.message || 'An error occurred';
    }
  } catch (error) {
    errorMessage.value = 'Something went wrong. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #ffffff;
  padding: 20px;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  width: 150px;
  height: 150px;
}

.login-title {
  font-size: 31px;
  font-weight: 700;
  color: #0f1419;
  margin-bottom: 30px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: none;
}

input {
  width: 100%;
  padding: 16px;
  border: 1px solid #cfd9de;
  border-radius: 4px;
  font-size: 17px;
  background: #ffffff;
  color: #0f1419;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #1d9bf0;
  border-width: 2px;
  padding: 15px;
}

input::placeholder {
  color: #536471;
}

.error-message {
  background: #fef1f1;
  color: #f4212e;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 15px;
  border: 1px solid #f4212e;
}

.success-message {
  background: #e8f5e9;
  color: #00ba7c;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 15px;
  border: 1px solid #00ba7c;
}

.btn-submit {
  width: 100%;
  padding: 14px;
  background: #0f1419;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 10px;
}

.btn-submit:hover:not(:disabled) {
  background: #272c30;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-mode {
  text-align: center;
  margin-top: 40px;
  color: #536471;
  font-size: 15px;
}

.toggle-mode a {
  color: #1d9bf0;
  text-decoration: none;
  cursor: pointer;
}

.toggle-mode a:hover {
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-card {
    padding: 32px 24px;
    margin: 16px;
    max-width: none;
  }
  
  .login-title {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }
  
  .login-card {
    padding: 24px 16px;
    margin: 8px;
  }
  
  .logo {
    width: 40px;
    height: 40px;
  }
  
  .login-title {
    font-size: 20px;
  }
  
  input {
    padding: 14px 16px;
    font-size: 15px;
  }
  
  .btn-submit {
    padding: 14px;
    font-size: 15px;
  }
}
</style>
