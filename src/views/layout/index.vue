<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
      <div class="logo">
<!--        <img src="@/assets/logo.png" alt="logo" />-->
        <span v-show="!isCollapse">超融合平台</span>
      </div>
      <el-scrollbar>
        <el-menu
          :default-active="route.path"
          class="el-menu-vertical"
          :router="true"
          :collapse="isCollapse"
          background-color="#1f2d3d"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item v-for="item in routes" :key="item.path" :index="'/' + item.path" class="menu-item">
            <el-icon class="menu-icon"><component :is="item.meta?.icon" /></el-icon>
            <template #title>
              <span class="menu-title">{{ item.meta?.title }}</span>
            </template>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
          <breadcrumb />
        </div>
        <div class="header-right">
          <el-dropdown trigger="click">
            <span class="user-info">
              <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
              <span>管理员</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu class="user-dropdown">
                <el-dropdown-item>
                  <el-icon><user /></el-icon>个人信息
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-icon><key /></el-icon>修改密码
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><switch-button /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main>
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '@/components/Breadcrumb.vue'
import { ArrowDown, User, Key, SwitchButton } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const isCollapse = ref(false)

const routes = computed(() => {
  return router.options.routes.find(r => r.path === '/' && r.children)?.children || []
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleLogout = () => {
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100%;
}

.aside {
  background-color: #1f2d3d;
  color: #fff;
  transition: width 0.3s;
  position: relative;
  z-index: 10;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: #2b2f3a;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.logo img {
  width: 32px;
  height: 32px;
  margin-right: 12px;
  transition: all 0.3s;
}

.logo span {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  transition: all 0.3s;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  position: relative;
  z-index: 9;
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  margin-right: 20px;
  color: #606266;
  transition: color 0.3s;
}

.collapse-btn:hover {
  color: #409EFF;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px 7px;
  border-radius: 4px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f0f2f5;
}

.user-info span {
  margin-left: 8px;
  margin-right: 4px;
  color: #606266;
}

.user-dropdown {
  font-size: 14px;
}

.el-dropdown-menu__item i {
  margin-right: 8px;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 220px;
}

.el-menu {
  border-right: none;
}

.menu-item {
  display: flex;
  align-items: center;
  transition: all 0.3s;
  position: relative;
  margin: 4px 0;
}

.menu-item.is-active {
  background-color: #263445 !important;
  border-radius: 4px;
  margin: 4px 10px;
  width: calc(100% - 20px);
}

.menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  background: #409EFF;
  border-radius: 2px;
}

.menu-item:hover {
  background-color: #263445 !important;
}

.menu-icon {
  font-size: 18px;
  margin-right: 5px;
  transition: all 0.3s;
}

.menu-title {
  font-size: 14px;
  font-weight: 500;
}

/* 页面切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style> 