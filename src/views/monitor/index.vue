<template>
  <div class="monitor-container">
    <el-row :gutter="20">
      <!-- 系统监控 -->
      <el-col :span="24">
        <el-card class="monitor-card" v-loading="chartsLoading">
          <template #header>
            <div class="card-header">
              <span>系统监控</span>
              <div class="header-right">
                <el-tooltip content="自动刷新" placement="top">
                  <el-switch v-model="autoRefresh" active-text="自动" />
                </el-tooltip>
                <el-button type="primary" @click="handleRefresh">
                  <el-icon><Refresh /></el-icon>刷新
                </el-button>
              </div>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="monitor-item">
                <div class="item-title">CPU使用率</div>
                <div class="item-value" :class="{ 'warning': systemStatus.cpu > 80 }">{{ systemStatus.cpu }}%</div>
                <div class="item-progress">
                  <el-progress
                    :percentage="systemStatus.cpu"
                    :status="systemStatus.cpu > 80 ? 'exception' : ''"
                    :stroke-width="8"
                  />
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="monitor-item">
                <div class="item-title">内存使用率</div>
                <div class="item-value" :class="{ 'warning': systemStatus.memory > 80 }">{{ systemStatus.memory }}%</div>
                <div class="item-progress">
                  <el-progress
                    :percentage="systemStatus.memory"
                    :status="systemStatus.memory > 80 ? 'exception' : ''"
                    :stroke-width="8"
                  />
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="monitor-item">
                <div class="item-title">存储使用率</div>
                <div class="item-value" :class="{ 'warning': systemStatus.storage > 80 }">{{ systemStatus.storage }}%</div>
                <div class="item-progress">
                  <el-progress
                    :percentage="systemStatus.storage"
                    :status="systemStatus.storage > 80 ? 'exception' : ''"
                    :stroke-width="8"
                  />
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="monitor-item">
                <div class="item-title">网络带宽</div>
                <div class="item-value" :class="{ 'warning': systemStatus.network > 80 }">{{ systemStatus.network }}Mbps</div>
                <div class="item-progress">
                  <el-progress
                    :percentage="systemStatus.network"
                    :status="systemStatus.network > 80 ? 'exception' : ''"
                    :stroke-width="8"
                  />
                </div>
              </div>
            </el-col>
          </el-row>
          <div class="monitor-charts">
            <div ref="cpuChartRef" class="chart"></div>
            <div ref="memoryChartRef" class="chart"></div>
            <div ref="storageChartRef" class="chart"></div>
            <div ref="networkChartRef" class="chart"></div>
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
                <el-button type="success" @click="handleBatchProcess" :disabled="!selectedAlerts.length">
                  <el-icon><Check /></el-icon>批量处理
                </el-button>
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
                <el-input v-model="searchForm.keyword" placeholder="告警内容/来源" clearable @keyup.enter="handleSearch">
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-select v-model="searchForm.level" placeholder="级别" clearable style="width: 120px">
                  <el-option label="严重" value="critical" />
                  <el-option label="警告" value="warning" />
                  <el-option label="提示" value="info" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 120px">
                  <el-option label="未处理" value="pending" />
                  <el-option label="处理中" value="processing" />
                  <el-option label="已处理" value="resolved" />
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
            <el-tag v-if="searchForm.status" type="info" closable @close="() => clearFilter('status')">
              状态：{{ getStatusName(searchForm.status) }}
            </el-tag>
            <el-tag v-if="searchForm.keyword" type="info" closable @close="() => clearFilter('keyword')">
              关键词：{{ searchForm.keyword }}
            </el-tag>
            <el-button v-if="hasFilter" size="small" type="text" @click="resetSearch">清除全部</el-button>
          </el-row>

          <!-- 告警列表 -->
          <el-table 
            :data="alertList" 
            border 
            style="width: 100%"
            @selection-change="handleSelectionChange"
            v-loading="loading"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="time" label="时间" min-width="160" sortable />
            <el-table-column prop="level" label="级别" min-width="80">
              <template #default="{ row }">
                <el-tag :type="row.level === 'critical' ? 'danger' : row.level === 'warning' ? 'warning' : 'info'">
                  {{ getLevelName(row.level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
            <el-table-column prop="source" label="来源" min-width="120" />
            <el-table-column prop="status" label="状态" min-width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusName(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="280" fixed="right">
              <template #default="{ row }">
                <div class="table-actions">
                  <el-button type="primary" link @click="handleProcess(row)">处理</el-button>
                  <el-button type="success" link @click="handleEdit(row)">编辑</el-button>
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

          <el-table :data="logList" style="width: 100%" v-loading="loading" border>
            <el-table-column prop="time" label="时间" width="180" sortable />
            <el-table-column prop="level" label="级别" width="100">
              <template #default="{ row }">
                <el-tag :type="getLogLevelTag(row.level)">{{ row.level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="module" label="模块" width="120" />
            <el-table-column prop="content" label="内容" show-overflow-tooltip />
            <el-table-column prop="operator" label="操作人" width="120" />
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="logCurrentPage"
              v-model:page-size="logPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="logTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleLogSizeChange"
              @current-change="handleLogCurrentChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加/编辑告警规则对话框 -->
    <el-dialog
      v-model="alertDialogVisible"
      :title="isEdit ? '编辑告警规则' : '添加告警规则'"
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
            <el-option label="应用告警" value="application" />
            <el-option label="安全告警" value="security" />
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
        <el-form-item label="持续时间" prop="duration">
          <el-input-number v-model="alertForm.duration" :min="1" :max="60" />
          <span class="unit">分钟</span>
        </el-form-item>
        <el-form-item label="通知方式" prop="notifyMethods">
          <el-checkbox-group v-model="alertForm.notifyMethods">
            <el-checkbox label="email">邮件</el-checkbox>
            <el-checkbox label="sms">短信</el-checkbox>
            <el-checkbox label="wechat">微信</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="alertForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="alertDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAlertSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 处理告警对话框 -->
    <el-dialog
      v-model="processDialogVisible"
      title="处理告警"
      width="500px"
    >
      <el-form
        ref="processFormRef"
        :model="processForm"
        :rules="processRules"
        label-width="100px"
      >
        <el-form-item label="处理方式" prop="method">
          <el-select v-model="processForm.method" placeholder="请选择处理方式">
            <el-option label="重启服务" value="restart" />
            <el-option label="清理缓存" value="clear" />
            <el-option label="扩容资源" value="scale" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理说明" prop="comment">
          <el-input v-model="processForm.comment" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="processDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleProcessSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Download, Search, Check } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { FormInstance } from 'element-plus'

// 自动刷新
const autoRefresh = ref(false)
let refreshTimer: number | null = null

// 系统状态
const systemStatus = reactive({
  cpu: 45,
  memory: 60,
  storage: 35,
  network: 50
})

// 告警列表
const loading = ref(false)
const selectedAlerts = ref<any[]>([])
const originalAlertList = ref([
  { 
    id: 1, 
    time: '2025-03-20 10:30:00', 
    level: 'critical', 
    content: '服务器A CPU使用率超过90%', 
    source: '服务器A',
    status: 'pending'
  },
  { 
    id: 2, 
    time: '2025-03-20 09:15:00', 
    level: 'warning', 
    content: '存储阵列B空间使用率超过80%', 
    source: '存储阵列B',
    status: 'processing'
  },
  { 
    id: 3, 
    time: '2025-03-19 16:45:00', 
    level: 'info', 
    content: '系统有新补丁可用', 
    source: '系统',
    status: 'resolved'
  },
  // ... 其他告警数据
])
const alertList = ref([...originalAlertList.value])

// 日志列表
const logList = ref([
  { 
    id: 1, 
    time: '2025-03-20 10:00:00', 
    level: 'info', 
    module: '系统', 
    content: '系统启动成功',
    operator: '系统管理员'
  },
  { 
    id: 2, 
    time: '2025-03-20 09:55:00', 
    level: 'warning', 
    module: 'CPU', 
    content: 'CPU使用率超过80%',
    operator: '监控系统'
  },
  // ... 其他日志数据
])

// 告警对话框
const alertDialogVisible = ref(false)
const isEdit = ref(false)
const alertFormRef = ref<FormInstance>()
const alertForm = reactive({
  name: '',
  type: '',
  level: '',
  threshold: 80,
  duration: 5,
  notifyMethods: ['email'],
  description: ''
})

// 处理告警对话框
const processDialogVisible = ref(false)
const processFormRef = ref<FormInstance>()
const processForm = reactive({
  method: '',
  comment: ''
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
  ],
  threshold: [
    { required: true, message: '请输入阈值', trigger: 'blur' }
  ],
  duration: [
    { required: true, message: '请输入持续时间', trigger: 'blur' }
  ],
  notifyMethods: [
    { required: true, message: '请选择通知方式', trigger: 'change' }
  ]
}

// 处理表单验证规则
const processRules = {
  method: [
    { required: true, message: '请选择处理方式', trigger: 'change' }
  ],
  comment: [
    { required: true, message: '请输入处理说明', trigger: 'blur' }
  ]
}

// 图表引用
const cpuChartRef = ref()
const memoryChartRef = ref()
const storageChartRef = ref()
const networkChartRef = ref()

// 搜索表单
const searchForm = reactive({
  keyword: '',
  level: '',
  status: ''
})

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 日志分页
const logCurrentPage = ref(1)
const logPageSize = ref(10)
const logTotal = ref(0)

const hasFilter = computed(() => !!searchForm.level || !!searchForm.status || !!searchForm.keyword)

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

// 获取状态名称
const getStatusName = (status: string) => {
  if (status === 'pending') return '未处理'
  if (status === 'processing') return '处理中'
  if (status === 'resolved') return '已处理'
  return status
}

// 获取状态类型
const getStatusType = (status: string) => {
  if (status === 'pending') return 'danger'
  if (status === 'processing') return 'warning'
  if (status === 'resolved') return 'success'
  return 'info'
}

// 添加图表加载状态
const chartsLoading = ref(true)

// 添加 currentAlert 变量
const currentAlert = ref<any>(null)

// 修改初始化图表函数
const initCharts = () => {
  chartsLoading.value = true
  // 确保DOM元素已经渲染
  nextTick(() => {
    try {
      if (!cpuChartRef.value || !memoryChartRef.value || !storageChartRef.value || !networkChartRef.value) {
        console.warn('Chart DOM elements not ready')
        return
      }

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
          smooth: true,
          areaStyle: {
            opacity: 0.3
          }
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
          smooth: true,
          areaStyle: {
            opacity: 0.3
          }
        }]
      })

      // 存储使用率图表
      const storageChart = echarts.init(storageChartRef.value)
      storageChart.setOption({
        title: {
          text: '存储使用率趋势'
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
          data: [35, 38, 40, 42, 45, 43, 40, 38],
          type: 'line',
          smooth: true,
          areaStyle: {
            opacity: 0.3
          }
        }]
      })

      // 网络带宽图表
      const networkChart = echarts.init(networkChartRef.value)
      networkChart.setOption({
        title: {
          text: '网络带宽趋势'
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
          data: [45, 50, 48, 55, 60, 58, 52, 48],
          type: 'line',
          smooth: true,
          areaStyle: {
            opacity: 0.3
          }
        }]
      })

      // 监听窗口大小变化
      const handleResize = () => {
        try {
          cpuChart.resize()
          memoryChart.resize()
          storageChart.resize()
          networkChart.resize()
        } catch (error) {
          console.error('Error resizing charts:', error)
        }
      }

      window.addEventListener('resize', handleResize)

      // 组件卸载时清理事件监听
      onUnmounted(() => {
        window.removeEventListener('resize', handleResize)
        try {
          cpuChart.dispose()
          memoryChart.dispose()
          storageChart.dispose()
          networkChart.dispose()
        } catch (error) {
          console.error('Error disposing charts:', error)
        }
      })

      chartsLoading.value = false
    } catch (error) {
      console.error('Error initializing charts:', error)
      chartsLoading.value = false
      ElMessage.error('图表初始化失败')
    }
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
  if (searchForm.status) {
    filtered = filtered.filter(d => d.status === searchForm.status)
  }
  total.value = filtered.length
  alertList.value = filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.level = ''
  searchForm.status = ''
  currentPage.value = 1
  handleSearch()
}

const clearFilter = (key: 'level' | 'status' | 'keyword') => {
  searchForm[key] = ''
  currentPage.value = 1
  handleSearch()
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

// 日志分页处理
const handleLogSizeChange = (val: number) => {
  logPageSize.value = val
  // 处理日志分页逻辑
}

const handleLogCurrentChange = (val: number) => {
  logCurrentPage.value = val
  // 处理日志分页逻辑
}

// 监听自动刷新
watch(autoRefresh, (val) => {
  if (val) {
    refreshTimer = window.setInterval(() => {
      handleRefresh()
    }, 30000) // 每30秒刷新一次
  } else if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

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
  isEdit.value = false
  alertDialogVisible.value = true
  alertForm.name = ''
  alertForm.type = ''
  alertForm.level = ''
  alertForm.threshold = 80
  alertForm.duration = 5
  alertForm.notifyMethods = ['email']
  alertForm.description = ''
}

// 编辑告警
const handleEdit = (row: any) => {
  isEdit.value = true
  alertDialogVisible.value = true
  alertForm.name = row.name
  alertForm.type = row.type
  alertForm.level = row.level
  alertForm.threshold = row.threshold
  alertForm.duration = row.duration
  alertForm.notifyMethods = row.notifyMethods
  alertForm.description = row.description
}

// 处理告警
const handleProcess = (row: any) => {
  currentAlert.value = row
  processDialogVisible.value = true
  processForm.method = ''
  processForm.comment = ''
}

// 批量处理
const handleBatchProcess = () => {
  if (selectedAlerts.value.length === 0) {
    ElMessage.warning('请选择要处理的告警')
    return
  }
  currentAlert.value = selectedAlerts.value[0] // 使用第一个选中的告警
  processDialogVisible.value = true
  processForm.method = ''
  processForm.comment = ''
}

// 删除告警
const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `确认删除告警"${row.content}"吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('删除成功')
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
      ElMessage.success(isEdit.value ? '编辑成功' : '添加成功')
    }
  })
}

// 提交处理表单
const handleProcessSubmit = async () => {
  if (!processFormRef.value) return
  processFormRef.value.validate((valid) => {
    if (valid) {
      const idx = alertList.value.findIndex(d => d.id === currentAlert.value?.id)
      if (idx !== -1) {
        alertList.value[idx].status = 'resolved'
        alertList.value[idx].processMethod = processForm.method
        alertList.value[idx].processComment = processForm.comment
        alertList.value[idx].processTime = new Date().toLocaleString()
        handleSearch()
        ElMessage.success('处理成功')
      }
      processDialogVisible.value = false
      currentAlert.value = null
    }
  })
}

// 选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedAlerts.value = selection
}

onMounted(() => {
  // 延迟初始化图表，确保DOM已经渲染
  setTimeout(() => {
    initCharts()
  }, 100)
  handleSearch()
})

onUnmounted(() => {
  // 清理自动刷新定时器
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }

  // 清理所有图表实例
  const charts = [
    cpuChartRef.value && echarts.getInstanceByDom(cpuChartRef.value),
    memoryChartRef.value && echarts.getInstanceByDom(memoryChartRef.value),
    storageChartRef.value && echarts.getInstanceByDom(storageChartRef.value),
    networkChartRef.value && echarts.getInstanceByDom(networkChartRef.value)
  ]

  charts.forEach(chart => {
    if (chart) {
      chart.dispose()
    }
  })
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
  align-items: center;
}

.monitor-item {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
  transition: all 0.3s;
}

.monitor-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
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

.item-value.warning {
  color: #e6a23c;
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
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
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
  flex-wrap: wrap;
  gap: 10px;
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

.unit {
  margin-left: 8px;
  color: #909399;
}

:deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  background: #f5f7fa;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-table) {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: #f5f7fa;
}

:deep(.el-table th) {
  font-weight: 600;
  color: #606266;
}

:deep(.el-table td) {
  padding: 12px 0;
}

:deep(.el-pagination) {
  justify-content: flex-end;
  margin-top: 20px;
}

:deep(.el-dialog__body) {
  padding: 20px 30px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input-number) {
  width: 180px;
}

:deep(.el-checkbox-group) {
  display: flex;
  gap: 20px;
}
</style> 