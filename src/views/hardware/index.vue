<template>
  <div class="hardware-container">
    <el-row :gutter="20">
      <!-- 超融合节点服务器 -->
      <el-col :span="24">
        <el-card class="hardware-card">
          <template #header>
            <div class="card-header">
              <span>超融合节点服务器</span>
              <el-tag type="success">2台</el-tag>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="内存配置">128GB DDR4 ECC</el-descriptions-item>
            <el-descriptions-item label="系统盘">4×1.92TB SSD</el-descriptions-item>
            <el-descriptions-item label="数据盘">2×4TB HDD</el-descriptions-item>
            <el-descriptions-item label="用途">系统+热数据+冷数据备份</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 分布式存储池 -->
      <el-col :span="24" style="margin-top: 20px;">
        <el-card class="hardware-card">
          <template #header>
            <div class="card-header">
              <span>分布式存储池</span>
              <el-tag type="primary">三节点集群</el-tag>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="总可用容量">约20TB</el-descriptions-item>
            <el-descriptions-item label="存储类型">SSD加速+HDD归档</el-descriptions-item>
            <el-descriptions-item label="冗余级别">三节点冗余</el-descriptions-item>
            <el-descriptions-item label="用途">数据存储与备份</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 网络设备 -->
      <el-col :span="24" style="margin-top: 20px;">
        <el-card class="hardware-card">
          <template #header>
            <div class="card-header">
              <span>网络设备</span>
              <el-tag type="warning">核心交换机</el-tag>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="设备类型">万兆核心交换机</el-descriptions-item>
            <el-descriptions-item label="端口数量">24口万兆</el-descriptions-item>
            <el-descriptions-item label="功能特性">支持VLAN隔离</el-descriptions-item>
            <el-descriptions-item label="用途">核心网络交换</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 备份系统 -->
      <el-col :span="24" style="margin-top: 20px;">
        <el-card class="hardware-card">
          <template #header>
            <div class="card-header">
              <span>数据备份系统</span>
              <el-tag type="info">备份软件</el-tag>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="备份类型">定时增量备份</el-descriptions-item>
            <el-descriptions-item label="备份目标">NAS/对象存储</el-descriptions-item>
            <el-descriptions-item label="备份策略">增量备份</el-descriptions-item>
            <el-descriptions-item label="用途">数据安全保护</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <!-- 资源使用监控 -->
    <el-card class="monitor-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>资源使用监控</span>
          <el-button type="primary" size="small">刷新</el-button>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="monitor-item">
            <div class="monitor-title">CPU使用率</div>
            <el-progress type="dashboard" :percentage="65" />
          </div>
        </el-col>
        <el-col :span="6">
          <div class="monitor-item">
            <div class="monitor-title">内存使用率</div>
            <el-progress type="dashboard" :percentage="78" />
          </div>
        </el-col>
        <el-col :span="6">
          <div class="monitor-item">
            <div class="monitor-title">存储使用率</div>
            <el-progress type="dashboard" :percentage="45" />
          </div>
        </el-col>
        <el-col :span="6">
          <div class="monitor-item">
            <div class="monitor-title">网络带宽使用率</div>
            <el-progress type="dashboard" :percentage="32" />
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 这里可以添加数据监控和刷新的逻辑
</script>

<style scoped>
.hardware-container {
  padding: 20px;
}

.hardware-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.monitor-card {
  margin-top: 20px;
}

.monitor-item {
  text-align: center;
  padding: 20px;
}

.monitor-title {
  margin-bottom: 15px;
  font-size: 16px;
  color: #606266;
}

:deep(.el-descriptions__label) {
  width: 120px;
  font-weight: bold;
}

:deep(.el-descriptions__content) {
  color: #606266;
}
</style> 