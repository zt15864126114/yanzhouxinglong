<template>
  <div class="monitor-container">
    <el-row :gutter="20">
      <!-- 系统监控 -->
      <el-col :span="24">
        <el-card class="monitor-card">
          <template #header>
            <div class="card-header">
              <span>系统监控</span>
              <el-button type="primary" @click="handleRefresh">
                <el-icon><Refresh /></el-icon>刷新
              </el-button>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="monitor-item">
                <div class="item-title">CPU使用率</div>
                <div class="item-value">{{ systemStatus.cpu }}%</div>
                <div class="item-progress">
                  <el-progress
                    :percentage="systemStatus.cpu"
                    :status="systemStatus.cpu > 80 ? 'exception' : ''"
                  />
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="monitor-item">
                <div class="item-title">内存使用率</div>
                <div class="item-value">{{ systemStatus.memory }}%</div>
                <div class="item-progress">
                  <el-progress
                    :percentage="systemStatus.memory"
                    :status="systemStatus.memory > 80 ? 'exception' : ''"
                  />
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="monitor-item">
                <div class="item-title">存储使用率</div>
                <div class="item-value">{{ systemStatus.storage }}%</div>
                <div class="item-progress">
                  <el-progress
                    :percentage="systemStatus.storage"
                    :status="systemStatus.storage > 80 ? 'exception' : ''"
                  />
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="monitor-item">
                <div class="item-title">网络带宽</div>
                <div class="item-value">{{ systemStatus.network }}Mbps</div>
                <div class="item-progress">
                  <el-progress
                    :percentage="systemStatus.network"
                    :status="systemStatus.network > 80 ? 'exception' : ''"
                  />
                </div>
              </div>
            </el-col>
          </el-row>
          <div class="monitor-charts">
            <div ref="cpuChartRef" class="chart"></div>
            <div ref="memoryChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 告警管理 -->
      <el-col :span="24" class="mt-20">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>告警管理</span>
              <div class="header-right">
                <el-button type="primary" @click="handleAddAlert">
                  <el-icon><Plus /></el-icon>添加告警规则
                </el-button>
              </div>
            </div>
          </template>

          <!-- 搜索和操作栏 -->
          <div class="operation-bar">
            <el-form :inline="true" :model="searchForm" class="search-form">
              <el-form-item>
                <el-input v-model="searchForm.keyword" placeholder="告警内容/来源" clearable @keyup.enter="handleSearch" />
              </el-form-item>
              <el-form-item>
                <el-select v-model="searchForm.level" placeholder="级别" clearable style="width: 120px">
                  <el-option label="严重" value="critical" />
                  <el-option label="警告" value="warning" />
                  <el-option label="提示" value="info" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSearch">搜索</el-button>
                <el-button @click="resetSearch">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          <!-- 筛选条件标签区 -->
          <el-row v-if="hasFilter" class="filter-tags" style="margin-bottom: 10px;">
            <el-tag v-if="searchForm.level" type="info" closable @close="() => clearFilter('level')">
              级别：{{ getLevelName(searchForm.level) }}
            </el-tag>
            <el-tag v-if="searchForm.keyword" type="info" closable @close="() => clearFilter('keyword')">
              关键词：{{ searchForm.keyword }}
            </el-tag>
            <el-button v-if="hasFilter" size="small" type="text" @click="resetSearch">清除全部</el-button>
          </el-row>
          <!-- 告警列表 -->
          <el-table :data="alertList" border style="width: 100%">
            <el-table-column prop="time" label="时间" min-width="160" />
            <el-table-column prop="level" label="级别" min-width="80">
              <template #default="{ row }">
                <el-tag :type="row.level === 'critical' ? 'danger' : row.level === 'warning' ? 'warning' : 'info'">
                  {{ getLevelName(row.level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="内容" min-width="200" />
            <el-table-column prop="source" label="来源" min-width="120" />
            <el-table-column label="操作" width="220">
              <template #default="{ row }">
                <div class="table-actions">
                  <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
                  <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 日志查看 -->
      <el-col :span="24" class="mt-20">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统日志</span>
              <div class="header-right">
                <el-button type="primary" @click="handleExport">
                  <el-icon><Download /></el-icon>导出日志
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="logList" style="width: 100%" v-loading="loading">
            <el-table-column prop="time" label="时间" width="180" />
            <el-table-column prop="level" label="级别">
              <template #default="{ row }">
                <el-tag :type="getLogLevelTag(row.level)">{{ row.level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="module" label="模块" />
            <el-table-column prop="content" label="内容" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加告警规则对话框 -->
    <el-dialog
      v-model="alertDialogVisible"
      title="添加告警规则"
      width="600px"
    >
      <el-form
        ref="alertFormRef"
        :model="alertForm"
        :rules="alertRules"
        label-width="100px"
      >
        <el-form-item label="告警名称" prop="name">
          <el-input v-model="alertForm.name" placeholder="请输入告警名称" />
        </el-form-item>
        <el-form-item label="告警类型" prop="type">
          <el-select v-model="alertForm.type" placeholder="请选择告警类型">
            <el-option label="CPU告警" value="cpu" />
            <el-option label="内存告警" value="memory" />
            <el-option label="存储告警" value="storage" />
            <el-option label="网络告警" value="network" />
          </el-select>
        </el-form-item>
        <el-form-item label="告警级别" prop="level">
          <el-select v-model="alertForm.level" placeholder="请选择告警级别">
            <el-option label="一般" value="normal" />
            <el-option label="警告" value="warning" />
            <el-option label="严重" value="critical" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值" prop="threshold">
          <el-input-number v-model="alertForm.threshold" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="alertForm.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="alertDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAlertSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { FormInstance } from 'element-plus'

// 系统状态
const systemStatus = reactive({
  cpu: 45,
  memory: 60,
  storage: 35,
  network: 50
})

// 告警列表
const loading = ref(false)
const originalAlertList = ref([
  { id: 1, time: '2025-03-20 10:30:00', level: 'critical', content: '服务器A CPU使用率超过90%', source: '服务器A' },
  { id: 2, time: '2025-03-20 09:15:00', level: 'warning', content: '存储阵列B空间使用率超过80%', source: '存储阵列B' },
  { id: 3, time: '2025-03-19 16:45:00', level: 'info', content: '系统有新补丁可用', source: '系统' },
  { id: 4, time: '2025-03-19 15:20:00', level: 'critical', content: '数据库服务器连接超时', source: '数据库服务器' },
  { id: 5, time: '2025-03-19 14:10:00', level: 'warning', content: '网络带宽利用率高于70%', source: '核心交换机' },
  { id: 6, time: '2025-03-18 18:30:00', level: 'info', content: '备份任务完成', source: '备份系统' },
  { id: 7, time: '2025-03-18 17:00:00', level: 'critical', content: '防火墙检测到异常流量', source: '防火墙' },
  { id: 8, time: '2025-03-18 16:00:00', level: 'warning', content: '应用服务器内存使用率高', source: '应用服务器' },
  { id: 9, time: '2025-03-18 15:00:00', level: 'info', content: '系统安全扫描完成', source: '安全模块' },
  { id: 10, time: '2025-03-18 14:00:00', level: 'critical', content: '分布式存储节点掉线', source: '分布式存储' }
])
const alertList = ref([...originalAlertList.value])

// 日志列表
const logList = ref([
  { id: 1, time: '2025-03-20 10:00:00', level: 'info', module: '系统', content: '系统启动成功' },
  { id: 2, time: '2025-03-20 09:55:00', level: 'warning', module: 'CPU', content: 'CPU使用率超过80%' },
  { id: 3, time: '2025-03-20 09:50:00', level: 'error', module: '数据库', content: '数据库连接超时' },
  { id: 4, time: '2025-03-20 09:45:00', level: 'info', module: '网络', content: '网络设备状态检查完成' },
  { id: 5, time: '2025-03-20 09:40:00', level: 'warning', module: '存储', content: '存储空间使用率超过70%' },
  { id: 6, time: '2025-03-20 09:35:00', level: 'info', module: '安全', content: '安全扫描完成' },
  { id: 7, time: '2025-03-20 09:30:00', level: 'error', module: '应用', content: '应用服务响应超时' },
  { id: 8, time: '2025-03-20 09:25:00', level: 'info', module: '备份', content: '数据备份任务完成' },
  { id: 9, time: '2025-03-20 09:20:00', level: 'warning', module: '网络', content: '网络丢包率升高' },
  { id: 10, time: '2025-03-20 09:15:00', level: 'error', module: '防火墙', content: '检测到异常访问尝试' }
])

// 告警对话框
const alertDialogVisible = ref(false)
const alertFormRef = ref<FormInstance>()
const alertForm = reactive({
  name: '',
  type: '',
  level: '',
  threshold: 80,
  description: ''
})

// 告警表单验证规则
const alertRules = {
  name: [
    { required: true, message: '请输入告警名称', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择告警类型', trigger: 'change' }
  ],
  level: [
    { required: true, message: '请选择告警级别', trigger: 'change' }
  ]
}

// 图表引用
const cpuChartRef = ref()
const memoryChartRef = ref()

// 搜索表单
const searchForm = reactive({
  keyword: '',
  level: ''
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const hasFilter = computed(() => !!searchForm.level || !!searchForm.keyword)

// 获取日志级别标签样式
const getLogLevelTag = (level: string) => {
  const levelMap: Record<string, string> = {
    info: 'info',
    warning: 'warning',
    error: 'danger'
  }
  return levelMap[level] || 'info'
}

// 获取级别名称
const getLevelName = (level: string) => {
  if (level === 'critical') return '严重'
  if (level === 'warning') return '警告'
  if (level === 'info') return '提示'
  return level
}

// 刷新数据
const handleRefresh = () => {
  loading.value = true
  // 模拟刷新请求
  setTimeout(() => {
    loading.value = false
    ElMessage.success('数据已刷新')
  }, 1000)
}

// 添加告警规则
const handleAddAlert = () => {
  alertDialogVisible.value = true
  alertForm.name = ''
  alertForm.type = ''
  alertForm.level = ''
  alertForm.threshold = 80
  alertForm.description = ''
}

// 删除告警
const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `确认删除告警"${row.name}"吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success(`告警"${row.name}"已删除`)
  })
}

// 导出日志
const handleExport = () => {
  ElMessage.success('日志导出中')
}

// 提交告警表单
const handleAlertSubmit = async () => {
  if (!alertFormRef.value) return
  
  await alertFormRef.value.validate((valid) => {
    if (valid) {
      alertDialogVisible.value = false
      ElMessage.success('添加成功')
    }
  })
}

// 初始化图表
const initCharts = () => {
  // CPU使用率图表
  const cpuChart = echarts.init(cpuChartRef.value)
  cpuChart.setOption({
    title: {
      text: 'CPU使用率趋势'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']
    },
    yAxis: {
      type: 'value',
      max: 100
    },
    series: [{
      data: [30, 40, 35, 50, 45, 60, 55, 45],
      type: 'line',
      smooth: true
    }]
  })

  // 内存使用率图表
  const memoryChart = echarts.init(memoryChartRef.value)
  memoryChart.setOption({
    title: {
      text: '内存使用率趋势'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']
    },
    yAxis: {
      type: 'value',
      max: 100
    },
    series: [{
      data: [50, 55, 60, 65, 70, 65, 60, 55],
      type: 'line',
      smooth: true
    }]
  })

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    cpuChart.resize()
    memoryChart.resize()
  })
}

// 搜索
const handleSearch = () => {
  let filtered = [...originalAlertList.value]
  if (searchForm.keyword) {
    filtered = filtered.filter(d => d.content.includes(searchForm.keyword) || d.source.includes(searchForm.keyword))
  }
  if (searchForm.level) {
    filtered = filtered.filter(d => d.level === searchForm.level)
  }
  total.value = filtered.length
  alertList.value = filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.level = ''
  currentPage.value = 1
  handleSearch()
}

const clearFilter = (key: 'level' | 'keyword') => {
  searchForm[key] = ''
  currentPage.value = 1
  handleSearch()
}

// 编辑告警
const handleEdit = (row: any) => {
  alertDialogVisible.value = true
  alertForm.name = row.name
  alertForm.type = row.type
  alertForm.level = row.level
  alertForm.threshold = row.threshold
  alertForm.description = row.description
}

// 处理大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  handleSearch()
}

// 处理当前变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  handleSearch()
}

onMounted(() => {
  initCharts()
  handleSearch()
})
</script>

<style scoped>
.monitor-container {
  padding: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-right {
  display: flex;
  gap: 10px;
}

.monitor-item {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.item-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.item-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.item-progress {
  margin-top: 10px;
}

.monitor-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.chart {
  height: 300px;
}

.operation-bar {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  display: flex;
  align-items: center;
}

.monitor-list {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.filter-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.table-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  min-width: 0;
}

.table-actions .el-button.is-link {
  font-size: 13px;
  padding: 0 6px;
  min-width: 0;
  max-width: 80px;
  white-space: nowrap;
}
</style> 