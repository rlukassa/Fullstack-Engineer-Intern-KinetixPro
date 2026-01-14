<script setup lang="ts">
interface PopupProps {
  show: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
}

const props = withDefaults(defineProps<PopupProps>(), {
  title: 'Confirmation',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'warning'
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
  close: [];
}>();

const handleConfirm = () => {
  emit('confirm');
  emit('close');
};

const handleCancel = () => {
  emit('cancel');
  emit('close');
};

const handleBackdropClick = () => {
  emit('cancel');
  emit('close');
};
</script>

<template>
  <Teleport to="body">
    <Transition name="popup">
      <div v-if="show" class="popup-overlay" @click="handleBackdropClick">
        <div class="popup-container" @click.stop :class="`popup-${type}`">
          <!-- Header -->
          <div class="popup-header">
            <h3 class="popup-title">{{ title }}</h3>
            <button class="close-btn" @click="handleCancel">
              <i class="fa-solid fa-circle-xmark"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="popup-body">
            <div class="popup-icon" :class="`icon-${type}`">
              <i v-if="type === 'danger'" class="fa-solid fa-circle-xmark"></i>
              <i v-else-if="type === 'warning'" class="fa-solid fa-code"></i>
              <i v-else-if="type === 'success'" class="fas fa-check-circle"></i>
              <i v-else class="fas fa-info-circle"></i>
            </div>
            <p class="popup-message">{{ message }}</p>
          </div>

          <div class="popup-footer">
            <button class="btn btn-cancel" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button class="btn btn-confirm" :class="`btn-${type}`" @click="handleConfirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.popup-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: scale(0.9) translateY(-20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eff3f4;
}

.popup-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f1419;
}

.close-btn {
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #536471;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #0f1419;
}

.close-btn i {
  font-size: 18px;
}

.popup-body {
  padding: 32px 24px;
  text-align: center;
}

.popup-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.icon-danger {
  background: rgba(244, 33, 46, 0.1);
  color: #f4212e;
}

.icon-warning {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.icon-success {
  background: rgba(0, 186, 124, 0.1);
  color: #00ba7c;
}

.icon-info {
  background: rgba(29, 155, 240, 0.1);
  color: #1d9bf0;
}

.popup-message {
  font-size: 16px;
  line-height: 1.6;
  color: #536471;
  margin: 0;
}

.popup-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #eff3f4;
}

.btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 50px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: white;
  color: #0f1419;
  border: 1px solid #cfd9de;
}

.btn-cancel:hover {
  background: rgba(0, 0, 0, 0.03);
}

.btn-confirm {
  color: white;
}

.btn-danger {
  background: #f4212e;
}

.btn-danger:hover {
  background: #dc1a29;
}

.btn-warning {
  background: #ffc107;
  color: #0f1419;
}

.btn-warning:hover {
  background: #ffb300;
}

.btn-success {
  background: #00ba7c;
}

.btn-success:hover {
  background: #00a368;
}

.btn-info {
  background: #1d9bf0;
}

.btn-info:hover {
  background: #1a8cd8;
}

/* Transition */
.popup-enter-active,
.popup-leave-active {
  transition: opacity 0.3s ease;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
}

.popup-enter-active .popup-container,
.popup-leave-active .popup-container {
  transition: transform 0.3s ease;
}

.popup-enter-from .popup-container,
.popup-leave-to .popup-container {
  transform: scale(0.9) translateY(-20px);
}
</style>
