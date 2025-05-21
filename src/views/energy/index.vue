<template>
  <div class="energy-container">
    <!-- 顶部统计卡片（新版） -->
    <div class="energy-stats new-style">
      <div class="stat-card2 total">
        <div class="icon-block"><el-icon><PieChart /></el-icon></div>
        <div class="stat-content">
          <div class="stat-title">总能耗</div>
          <div class="stat-value">{{ formatEnergy(stat.total) }}</div>
          <div class="stat-trend" :class="stat.totalTrend >= 0 ? 'up' : 'down'">
            <el-icon v-if="stat.totalTrend >= 0"><Top /></el-icon>
            <el-icon v-else><Bottom /></el-icon>
            {{ Math.abs(stat.totalTrend) }}%
          </div>
        </div>
      </div>
      <div class="stat-card2 server">
        <div class="icon-block"><el-icon><Cpu /></el-icon></div>
        <div class="stat-content">
          <div class="stat-title">服务器能耗</div>
          <div class="stat-value">{{ formatEnergy(stat.server) }}</div>
          <div class="stat-trend" :class="stat.serverTrend >= 0 ? 'up' : 'down'">
            <el-icon v-if="stat.serverTrend >= 0"><Top /></el-icon>
            <el-icon v-else><Bottom /></el-icon>
            {{ Math.abs(stat.serverTrend) }}%
          </div>
        </div>
      </div>
      <div class="stat-card2 network">
        <div class="icon-block"><el-icon><Connection /></el-icon></div>
        <div class="stat-content">
          <div class="stat-title">网络设备能耗</div>
          <div class="stat-value">{{ formatEnergy(stat.network) }}</div>
          <div class="stat-trend" :class="stat.networkTrend >= 0 ? 'up' : 'down'">
            <el-icon v-if="stat.networkTrend >= 0"><Top /></el-icon>
            <el-icon v-else><Bottom /></el-icon>
            {{ Math.abs(stat.networkTrend) }}%
          </div>
        </div>
      </div>
      <div class="stat-card2 storage">
        <div class="icon-block"><el-icon><Document /></el-icon></div>
        <div class="stat-content">
          <div class="stat-title">存储设备能耗</div>
          <div class="stat-value">{{ formatEnergy(stat.storage) }}</div>
          <div class="stat-trend" :class="stat.storageTrend >= 0 ? 'up' : 'down'">
            <el-icon v-if="stat.storageTrend >= 0"><Top /></el-icon>
            <el-icon v-else><Bottom /></el-icon>
            {{ Math.abs(stat.storageTrend) }}%
          </div>
        </div>
      </div>
    </div>

    <!-- 能耗趋势图 -->
    <el-card class="trend-card" shadow="hover">
      <div class="trend-header">
        <div class="trend-title">能耗趋势</div>
        <el-radio-group v-model="trendType" size="small">
          <el-radio-button label="day">日</el-radio-button>
          <el-radio-button label="week">周</el-radio-button>
          <el-radio-button label="month">月</el-radio-button>
        </el-radio-group>
      </div>
      <div class="trend-chart-wrap">
        <el-empty v-if="trendLoading" description="加载中..." />
        <el-empty v-else-if="!hasTrendData" description="暂无数据" />
        <div v-show="!trendLoading && hasTrendData" ref="trendChartRef" class="trend-chart"></div>
      </div>
    </el-card>

    <!-- 能耗分析 -->
    <div class="analysis-section">
      <el-card class="analysis-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>能耗分布</span>
            <el-button type="primary" link @click="exportPie">导出图片</el-button>
          </div>
        </template>
        <div ref="pieChartRef" class="pie-chart"></div>
      </el-card>
      <el-card class="analysis-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>能耗排行</span>
          </div>
        </template>
        <el-table :data="energyRanking" style="width: 100%" class="ranking-table">
          <el-table-column prop="name" label="设备名称">
            <template #default="{ row, $index }">
              <span :class="['rank-index', $index < 3 ? 'top' + ($index + 1) : '']">{{$index + 1}}</span>
              <el-icon v-if="row.type === '服务器'" class="type-icon"><Cpu /></el-icon>
              <el-icon v-else-if="row.type === '网络设备'" class="type-icon"><Connection /></el-icon>
              <el-icon v-else class="type-icon"><Document /></el-icon>
              <span>{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="设备类型" />
          <el-table-column prop="energy" label="能耗">
            <template #default="{ row }">
              {{ formatEnergy(row.energy) }}
            </template>
          </el-table-column>
          <el-table-column prop="trend" label="趋势">
            <template #default="{ row }">
              <span :class="row.trend >= 0 ? 'up' : 'down'">
                <el-icon v-if="row.trend >= 0" class="arrow"><Top /></el-icon>
                <el-icon v-else class="arrow"><Bottom /></el-icon>
                {{ Math.abs(row.trend) }}%
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { PieChart, Cpu, Connection, Document, Top, Bottom } from '@element-plus/icons-vue'

interface EnergyRanking {
  name: string
  type: string
  energy: number
  trend: number
}

interface TrendData {
  xAxis: string[];
  series: {
    name: string;
    data: number[];
  }[];
}

interface TrendDataType {
  day: TrendData;
  week: TrendData;
  month: TrendData;
}

const stat = reactive({
  total: 12580,
  totalTrend: -5.2,
  server: 6850,
  serverTrend: -3.8,
  network: 3200,
  networkTrend: -6.5,
  storage: 2530,
  storageTrend: -4.2
})

const trendType = ref('day')
const trendChartRef = ref<HTMLDivElement | null>(null)
const pieChartRef = ref<HTMLDivElement | null>(null)
const trendLoading = ref(false)

const energyRanking = ref<EnergyRanking[]>([
  { name: '核心交换机-01', type: '网络设备', energy: 850, trend: -5.2 },
  { name: '存储阵列-02', type: '存储设备', energy: 720, trend: -3.8 },
  { name: '应用服务器-03', type: '服务器', energy: 680, trend: -4.5 },
  { name: '数据库服务器-01', type: '服务器', energy: 650, trend: -2.8 },
  { name: '备份服务器-02', type: '服务器', energy: 580, trend: -6.2 }
])

const trendData: TrendDataType = {
  day: {
    xAxis: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
    series: [
      { name: '服务器', data: [320, 280, 250, 380, 420, 450, 400, 350] },
      { name: '网络设备', data: [150, 130, 120, 180, 200, 220, 190, 160] },
      { name: '存储设备', data: [120, 110, 100, 140, 160, 170, 150, 130] }
    ]
  },
  week: {
    xAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    series: [
      { name: '服务器', data: [3200, 3100, 3300, 3400, 3200, 2800, 2900] },
      { name: '网络设备', data: [1500, 1450, 1550, 1600, 1500, 1300, 1350] },
      { name: '存储设备', data: [1200, 1180, 1250, 1300, 1200, 1100, 1150] }
    ]
  },
  month: {
    xAxis: ['1月', '2月', '3月', '4月', '5月', '6月'],
    series: [
      { name: '服务器', data: [32000, 31000, 33000, 34000, 32000, 28000] },
      { name: '网络设备', data: [15000, 14500, 15500, 16000, 15000, 13000] },
      { name: '存储设备', data: [12000, 11800, 12500, 13000, 12000, 11000] }
    ]
  }
}

const hasTrendData = computed(() => {
  const data = trendData[trendType.value as keyof TrendDataType]
  return data && data.series.some(s => s.data && s.data.length > 0)
})

function formatEnergy(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}kWh` : `${value}Wh`
}

function renderTrendChart() {
  if (!trendChartRef.value) return
  const chart = echarts.init(trendChartRef.value)
  const data = trendData[trendType.value as keyof TrendDataType]

  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['服务器', '网络设备', '存储设备'] },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: data.xAxis },
    yAxis: { type: 'value', name: '能耗(Wh)' },
    color: ['#409EFF', '#67C23A', '#E6A23C'],
    series: data.series.map((item: { name: string; data: number[] }) => ({
      name: item.name,
      type: 'line',
      data: item.data,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3 },
      areaStyle: { opacity: 0.08 }
    }))
  })
}

function renderPieChart() {
  if (!pieChartRef.value) return
  const chart = echarts.init(pieChartRef.value)

  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    color: ['#409EFF', '#67C23A', '#E6A23C'],
    series: [{
      type: 'pie',
      radius: '50%',
      data: [
        { value: stat.server, name: '服务器' },
        { value: stat.network, name: '网络设备' },
        { value: stat.storage, name: '存储设备' }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      label: { formatter: '{b}: {d}% ({c}Wh)' }
    }]
  })
}

function exportPie() {
  if (!pieChartRef.value) return
  const chart = echarts.getInstanceByDom(pieChartRef.value)
  if (chart) {
    const url = chart.getDataURL({ type: 'png' })
    const a = document.createElement('a')
    a.href = url
    a.download = '能耗分布.png'
    a.click()
    ElMessage.success('导出成功')
  }
}

watch(trendType, () => {
  trendLoading.value = true
  setTimeout(() => {
    trendLoading.value = false
    nextTick(() => {
      renderTrendChart()
    })
  }, 500)
})

onMounted(() => {
  nextTick(() => {
    renderTrendChart()
    renderPieChart()
  })
})
</script>

<style scoped>
.energy-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.energy-stats.new-style {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.stat-card2 {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.04);
  padding: 24px 32px;
  min-width: 260px;
  flex: 1 1 260px;
  max-width: 360px;
}
.icon-block {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-right: 24px;
  color: #fff;
}
.stat-card2.total .icon-block { background: #409EFF; }
.stat-card2.server .icon-block { background: #67C23A; }
.stat-card2.network .icon-block { background: #E6A23C; }
.stat-card2.storage .icon-block { background: #F56C6C; }
.stat-content {
  flex: 1;
}
.stat-title {
  font-size: 15px;
  color: #888;
  margin-bottom: 6px;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #222;
  margin-bottom: 6px;
}
.stat-trend {
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 2px;
}
.stat-trend.up { color: #67C23A; }
.stat-trend.down { color: #F56C6C; }
.stat-trend .el-icon { font-size: 16px; }
.trend-card {
  margin-bottom: 20px;
}
.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.trend-title {
  font-size: 15px;
  color: #888;
}
.trend-chart-wrap {
  width: 100%;
  height: 360px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.trend-chart {
  width: 100%;
  height: 360px;
}
.analysis-section {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.analysis-card {
  flex: 1 1 380px;
  min-width: 320px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pie-chart {
  width: 100%;
  height: 300px;
}
.ranking-table .rank-index {
  display: inline-block;
  width: 28px;
  text-align: center;
  font-weight: bold;
  margin-right: 6px;
  border-radius: 50%;
  background: #f2f6fc;
  color: #909399;
}
.ranking-table .rank-index.top1 {
  background: #409EFF;
  color: #fff;
}
.ranking-table .rank-index.top2 {
  background: #67C23A;
  color: #fff;
}
.ranking-table .rank-index.top3 {
  background: #E6A23C;
  color: #fff;
}
.ranking-table .type-icon {
  margin-right: 4px;
  vertical-align: middle;
}
.ranking-table .up { color: #F56C6C; }
.ranking-table .down { color: #67C23A; }
@media (max-width: 900px) {
  .energy-stats.new-style {
    flex-direction: column;
    gap: 12px;
  }
  .stat-card2 {
    min-width: 0;
    max-width: 100%;
    padding: 18px 16px;
  }
}
</style>
