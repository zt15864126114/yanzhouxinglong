<template>
  <div class="login-container">
    <div class="login-background"></div>
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
<!--          <img src="@/assets/logo.png" alt="logo" class="logo" />-->
          <h2>超融合平台</h2>
          <p class="subtitle">智慧城市 · 数字政务</p>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="登录" name="login">
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            label-width="0"
            size="large"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="用户名"
                :prefix-icon="User"
                class="custom-input"
              />
            </el-form-item>
            
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="密码"
                :prefix-icon="Lock"
                @keyup.enter="handleLogin"
                class="custom-input"
              />
            </el-form-item>
            
            <el-form-item class="remember-forgot">
              <el-checkbox v-model="loginForm.remember">记住密码</el-checkbox>
              <el-link type="primary" class="forgot-password">忘记密码？</el-link>
            </el-form-item>
            
            <el-form-item>
              <el-button
                :loading="loading"
                type="primary"
                class="login-button"
                @click="handleLogin"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="注册" name="register">
          <el-form
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            label-width="0"
            size="large"
            class="register-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="registerForm.username"
                placeholder="用户名"
                :prefix-icon="User"
                class="custom-input"
              />
            </el-form-item>
            
            <el-form-item prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="密码"
                :prefix-icon="Lock"
                class="custom-input"
              />
            </el-form-item>
            
            <el-form-item prop="phone">
              <el-input
                v-model="registerForm.phone"
                placeholder="手机号"
                :prefix-icon="Phone"
                class="custom-input"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button
                :loading="registerLoading"
                type="primary"
                class="register-button"
                @click="handleRegister"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Phone } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()
const loading = ref(false)
const registerLoading = ref(false)
const activeTab = ref('login')

const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

const registerForm = reactive({
  username: '',
  password: '',
  phone: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于 6 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      // 模拟登录请求
      setTimeout(() => {
        loading.value = false
        ElMessage.success('登录成功')
        router.push('/dashboard')
      }, 1000)
    }
  })
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate((valid) => {
    if (valid) {
      registerLoading.value = true
      // 模拟注册请求
      setTimeout(() => {
        registerLoading.value = false
        ElMessage.success('注册成功，请查收激活链接')
        activeTab.value = 'login'
      }, 1000)
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  opacity: 0.1;
  z-index: 0;
}

.login-card {
  width: 420px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 1;
  transition: all 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.card-header {
  text-align: center;
  padding: 20px 0;
}

.logo {
  width: 72px;
  height: 72px;
  margin-bottom: 16px;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.1);
}

.card-header h2 {
  margin: 0;
  font-size: 28px;
  color: #1890ff;
  font-weight: 600;
}

.subtitle {
  margin: 8px 0 0;
  color: #666;
  font-size: 14px;
}

.login-tabs {
  padding: 0 20px;
}

.login-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: #e8e8e8;
}

.login-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  height: 48px;
  line-height: 48px;
}

.login-tabs :deep(.el-tabs__item.is-active) {
  color: #1890ff;
  font-weight: 600;
}

.login-form,
.register-form {
  padding: 20px 0;
}

.custom-input :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.3s ease;
}

.custom-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #1890ff inset;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #1890ff inset;
}

.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.forgot-password {
  font-size: 14px;
}

.login-button,
.register-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 22px;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover,
.register-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.login-button:active,
.register-button:active {
  transform: translateY(0);
}
</style> 