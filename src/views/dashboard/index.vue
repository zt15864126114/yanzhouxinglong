<template>
    <div class="dashboard-container">
      <h1 class="dashboard-title">济宁市兖州区兴隆庄街道办事处超融合平台</h1>
      <!-- 顶部统计卡片 -->
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <template #header>
              <div class="card-header">
                <span>业务系统</span>
                <el-tag type="success">运行中</el-tag>
              </div>
            </template>
            <div class="stat-content">
              <div class="stat-number">{{ systemStats.total }}</div>
              <div class="stat-label">系统总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <template #header>
              <div class="card-header">
                <span>硬件资源</span>
                <el-tag type="primary">正常</el-tag>
              </div>
            </template>
            <div class="stat-content">
              <div class="stat-number">{{ hardwareStats.total }}</div>
              <div class="stat-label">资源总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <template #header>
              <div class="card-header">
                <span>存储容量</span>
                <el-tag type="warning">使用中</el-tag>
              </div>
            </template>
            <div class="stat-content">
              <div class="stat-number">{{ storageStats.used }}TB</div>
              <div class="stat-label">已用/{{ storageStats.total }}TB</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <template #header>
              <div class="card-header">
                <span>系统负载</span>
                <el-tag type="info">实时</el-tag>
              </div>
            </template>
            <div class="stat-content">
              <div class="stat-number">{{ loadStats.cpu }}%</div>
              <div class="stat-label">CPU使用率</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
  
      <!-- 业务系统状态 -->
      <el-card class="system-status" style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>业务系统状态</span>
            <el-button type="primary" size="small" @click="refreshSystemStatus">刷新</el-button>
          </div>
        </template>
        <el-table :data="systemList" style="width: 100%" :max-height="400">
          <el-table-column prop="systemName" label="系统名称" min-width="180" />
          <el-table-column prop="owner" label="负责人" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === '运行中' ? 'success' : 'danger'">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" width="180" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default>
              <!-- 删除"查看详情"按钮 -->
            </template>
          </el-table-column>
        </el-table>
      </el-card>
  
      <!-- 硬件资源监控 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card class="monitor-card">
            <template #header>
              <div class="card-header">
                <span>资源使用趋势</span>
                <el-radio-group v-model="timeRange" size="small">
                  <el-radio-button label="day">24小时</el-radio-button>
                  <el-radio-button label="week">7天</el-radio-button>
                  <el-radio-button label="month">30天</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div ref="trendChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="monitor-card">
            <template #header>
              <div class="card-header">
                <span>系统告警</span>
                <el-button type="primary" size="small" @click="refreshAlarms">刷新</el-button>
              </div>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="(alarm, index) in alarmList"
                :key="index"
                :type="alarm.type"
                :timestamp="alarm.time"
              >
                {{ alarm.content }}
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
  import * as echarts from 'echarts'
  
  // 统计数据
  const systemStats = ref({
    total: 18,
    running: 18,
    warning: 0,
    error: 0
  })
  
  const hardwareStats = ref({
    total: 4,
    normal: 4,
    warning: 0,
    error: 0
  })
  
  const storageStats = ref({
    total: 20,
    used: 9,
    free: 11
  })
  
  const loadStats = ref({
    cpu: 65,
    memory: 78,
    storage: 45,
    network: 32
  })
  
  // 时间范围选择
  const timeRange = ref('day')
  
  // 系统列表数据
  const systemList = ref([
    { id: 1, systemName: '社区人口管理', owner: '王晓强', status: '运行中', updateTime: '2025-04-01 09:00' },
    { id: 2, systemName: '便民服务门户', owner: '李文娜', status: '运行中', updateTime: '2025-04-01 08:30' },
    { id: 3, systemName: '社区监控平台', owner: '刘志洋', status: '运行中', updateTime: '2025-03-31 17:00' },
    { id: 4, systemName: '网格化管理平台', owner: '张丽敏', status: '运行中', updateTime: '2025-03-31 16:00' },
    { id: 5, systemName: '应急指挥系统', owner: '陈国磊', status: '运行中', updateTime: '2025-03-30 14:00' }
  ])
  
  // 告警列表
  const alarmList = ref([
    { type: 'warning', time: '2025-04-01 10:30', content: '存储空间使用率超过70%' },
    { type: 'info', time: '2025-04-01 09:15', content: '系统例行维护完成' },
    { type: 'success', time: '2025-04-01 08:00', content: '数据备份任务完成' }
  ])
  
  // 刷新方法
  const refreshSystemStatus = () => {
    // 实现刷新逻辑
  }
  
  const refreshAlarms = () => {
    // 实现刷新逻辑
  }
  
  const trendChartRef = ref<HTMLElement | null>(null)
  let trendChart: echarts.ECharts | null = null
  
  const getTrendData = () => {
    // 根据 timeRange 返回不同的模拟数据
    if (timeRange.value === 'day') {
      return {
        x: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        cpu: [65, 60, 62, 66, 68, 72, 69, 70, 68, 67, 66, 65, 64, 63, 62, 61, 60, 62, 64, 66, 68, 70, 72, 74],
        mem: [78, 75, 76, 77, 79, 81, 78, 77, 76, 75, 74, 73, 72, 71, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88],
        storage: [45, 44, 44, 45, 45, 46, 46, 47, 47, 48, 48, 49, 49, 50, 50, 51, 51, 52, 52, 53, 53, 54, 54, 55]
      }
    } else if (timeRange.value === 'week') {
      return {
        x: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        cpu: [65, 60, 70, 66, 68, 72, 69],
        mem: [78, 75, 80, 77, 79, 81, 78],
        storage: [45, 44, 46, 45, 47, 48, 45]
      }
    } else {
      return {
        x: Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
        cpu: Array.from({ length: 30 }, () => Math.floor(60 + Math.random() * 15)),
        mem: Array.from({ length: 30 }, () => Math.floor(70 + Math.random() * 20)),
        storage: Array.from({ length: 30 }, () => Math.floor(40 + Math.random() * 15))
      }
    }
  }
  
  const renderTrendChart = () => {
    if (!trendChartRef.value) return
    if (!trendChart) {
      trendChart = echarts.init(trendChartRef.value)
    }
    const data = getTrendData()
    const option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['CPU', '内存', '存储'] },
      xAxis: { type: 'category', data: data.x },
      yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
      series: [
        { name: 'CPU', type: 'line', data: data.cpu, smooth: true },
        { name: '内存', type: 'line', data: data.mem, smooth: true },
        { name: '存储', type: 'line', data: data.storage, smooth: true }
      ]
    }
    trendChart.setOption(option)
  }
  
  onMounted(() => {
    renderTrendChart()
    window.addEventListener('resize', () => trendChart?.resize())
  })
  onBeforeUnmount(() => {
    trendChart?.dispose()
  })
  watch(timeRange, () => {
    renderTrendChart()
  })
  </script>
  
  <style scoped>
  .dashboard-container {
    padding: 20px;
  }
  
  .dashboard-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .stat-card {
    height: 180px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .stat-content {
    text-align: center;
    padding: 20px 0;
  }
  
  .stat-number {
    font-size: 36px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 8px;
  }
  
  .stat-label {
    font-size: 14px;
    color: #909399;
  }
  
  .system-status {
    margin-bottom: 20px;
  }
  
  .monitor-card {
    height: 400px;
  }
  
  .chart-container {
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .chart-placeholder {
    color: #909399;
    font-size: 14px;
  }
  
  :deep(.el-timeline-item__content) {
    color: #606266;
  }
  
  :deep(.el-timeline-item__timestamp) {
    color: #909399;
  }
  </style>
  