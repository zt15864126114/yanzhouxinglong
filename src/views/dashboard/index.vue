<template>
    <div class="dashboard-container">
      <!-- 数据概览卡片 -->
      <el-row :gutter="20" class="data-overview">
        <el-col :span="6" v-for="(item, index) in overviewData" :key="index">
          <el-card shadow="hover" class="overview-card">
            <div class="overview-item">
              <div class="overview-icon" :style="{ background: item.color }">
                <el-icon><component :is="item.icon" /></el-icon>
              </div>
              <div class="overview-info">
                <div class="overview-title">{{ item.title }}</div>
                <div class="overview-value">{{ item.value }}</div>
                <div class="overview-trend" :class="item.trend">
                  {{ item.trend === 'up' ? '↑' : '↓' }} {{ item.rate }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
  
      <!-- 图表区域 -->
      <el-row :gutter="20" class="chart-row">
        <el-col :span="16">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>系统资源使用趋势</span>
                <el-radio-group v-model="timeRange" size="small">
                  <el-radio-button label="week">本周</el-radio-button>
                  <el-radio-button label="month">本月</el-radio-button>
                  <el-radio-button label="year">全年</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="chart-container" ref="resourceChartRef"></div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>资源分布</span>
              </div>
            </template>
            <div class="chart-container" ref="pieChartRef"></div>
          </el-card>
        </el-col>
      </el-row>
  
      <!-- 系统状态 -->
      <el-row :gutter="20" class="status-row">
        <el-col :span="12">
          <el-card class="status-card">
            <template #header>
              <div class="card-header">
                <span>系统告警</span>
                <div class="dashboard-actions">
                  <el-button type="primary" link>查看全部</el-button>
                </div>
              </div>
            </template>
            <el-table :data="alerts" style="width: 100%">
              <el-table-column prop="time" label="时间" width="180" />
              <el-table-column prop="level" label="级别" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.level === '严重' ? 'danger' : row.level === '警告' ? 'warning' : 'info'">
                    {{ row.level }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="content" label="内容" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="status-card">
            <template #header>
              <div class="card-header">
                <span>最近操作</span>
                <div class="dashboard-actions">
                  <el-button type="primary" link>查看全部</el-button>
                </div>
              </div>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="(activity, index) in activities"
                :key="index"
                :timestamp="activity.timestamp"
                :type="activity.type"
              >
                {{ activity.content }}
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import * as echarts from 'echarts';
  
  // 数据概览
  const overviewData = ref([
    {
      title: '在线设备',
      value: '50',
      icon: 'Monitor',
      color: '#409EFF',
      trend: 'up',
      rate: '12'
    },
    {
      title: '资源使用率',
      value: '68%',
      icon: 'Connection',
      color: '#67C23A',
      trend: 'down',
      rate: '5'
    },
    {
      title: '数据总量',
      value: '2.5TB',
      icon: 'DataLine',
      color: '#E6A23C',
      trend: 'up',
      rate: '8'
    },
    {
      title: '告警数量',
      value: '12',
      icon: 'Warning',
      color: '#F56C6C',
      trend: 'down',
      rate: '3'
    }
  ]);
  
  // 时间范围选择
  const timeRange = ref('week');
  
  // 图表实例
  let resourceChart: echarts.ECharts | null = null;
  let pieChart: echarts.ECharts | null = null;
  const resourceChartRef = ref<HTMLElement>();
  const pieChartRef = ref<HTMLElement>();
  
  // 系统告警数据
  const alerts = ref([
    {
      time: '2025-03-20 10:30:00',
      level: '严重',
      content: '服务器CPU使用率超过90%'
    },
    {
      time: '2025-03-20 09:15:00',
      level: '警告',
      content: '存储空间使用率超过80%'
    },
    {
      time: '2025-03-19 16:45:00',
      level: '提示',
      content: '系统更新可用'
    }
  ]);
  
  // 最近操作数据
  const activities = ref([
    {
      content: '系统管理员登录系统',
      timestamp: '2025-03-20 10:00:00',
      type: 'primary'
    },
    {
      content: '新增用户：张三',
      timestamp: '2025-03-20 09:30:00',
      type: 'success'
    },
    {
      content: '更新系统配置',
      timestamp: '2025-03-20 09:00:00',
      type: 'info'
    }
  ]);
  
  // 初始化资源使用趋势图表
  const initResourceChart = () => {
    if (!resourceChartRef.value) return;
    
    resourceChart = echarts.init(resourceChartRef.value);
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['CPU使用率', '内存使用率', '存储使用率']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: 'CPU使用率',
          type: 'line',
          data: [65, 72, 68, 75, 82, 70, 65],
          smooth: true
        },
        {
          name: '内存使用率',
          type: 'line',
          data: [45, 52, 48, 55, 62, 50, 45],
          smooth: true
        },
        {
          name: '存储使用率',
          type: 'line',
          data: [35, 42, 38, 45, 52, 40, 35],
          smooth: true
        }
      ]
    };
    resourceChart.setOption(option);
  };
  
  // 初始化资源分布饼图
  const initPieChart = () => {
    if (!pieChartRef.value) return;
    
    pieChart = echarts.init(pieChartRef.value);
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '资源分布',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '20',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: 1048, name: '计算资源' },
            { value: 735, name: '存储资源' },
            { value: 580, name: '网络资源' },
            { value: 484, name: '其他资源' }
          ]
        }
      ]
    };
    pieChart.setOption(option);
  };
  
  // 监听窗口大小变化
  const handleResize = () => {
    resourceChart?.resize();
    pieChart?.resize();
  };
  
  onMounted(() => {
    initResourceChart();
    initPieChart();
    window.addEventListener('resize', handleResize);
  });
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    resourceChart?.dispose();
    pieChart?.dispose();
  });
  </script>
  
  <style scoped>
  .dashboard-container {
    padding: 20px;
  }
  
  .data-overview {
    margin-bottom: 20px;
  }
  
  .overview-card {
    height: 120px;
  }
  
  .overview-item {
    display: flex;
    align-items: center;
    height: 100%;
  }
  
  .overview-icon {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
  }
  
  .overview-icon :deep(.el-icon) {
    font-size: 32px;
    color: white;
  }
  
  .overview-info {
    flex: 1;
  }
  
  .overview-title {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
  }
  
  .overview-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 8px;
  }
  
  .overview-trend {
    font-size: 12px;
  }
  
  .overview-trend.up {
    color: #67C23A;
  }
  
  .overview-trend.down {
    color: #F56C6C;
  }
  
  .chart-row {
    margin-bottom: 20px;
  }
  
  .chart-card {
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .chart-container {
    height: 300px;
  }
  
  .status-card {
    height: 400px;
  }
  
  :deep(.el-timeline-item__content) {
    color: #606266;
  }
  
  :deep(.el-timeline-item__timestamp) {
    color: #909399;
  }
  
  .dashboard-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .dashboard-actions .el-button.is-link {
    font-size: 14px;
    padding: 0 10px;
    min-width: 0;
    background: none !important;
    border: none !important;
    box-shadow: none !important;
    height: 28px !important;
    line-height: 28px !important;
  }
  </style>
  