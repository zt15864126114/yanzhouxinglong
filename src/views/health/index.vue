<template>
  <div class="health-container">
    <div class="health-stats">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-title">正常服务</div>
        <div class="stat-value normal">{{ stat.normal }}</div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-title">异常服务</div>
        <div class="stat-value error">{{ stat.error }}</div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-title">告警服务</div>
        <div class="stat-value warning">{{ stat.warning }}</div>
      </el-card>
    </div>
    <el-card class="trend-card" shadow="hover">
      <div class="trend-title">近7天服务健康趋势</div>
      <div ref="trendChartRef" class="trend-chart"></div>
    </el-card>
    <div class="operation-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input v-model="searchForm.keyword" placeholder="服务名称/负责人" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.status" placeholder="健康状态" clearable style="width: 140px">
            <el-option label="正常" value="正常" />
            <el-option label="异常" value="异常" />
            <el-option label="告警" value="告警" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-card class="health-list">
      <el-button type="primary" link @click="handleAdd" style="margin-bottom: 12px;">新增服务</el-button>
      <el-table :data="healthList" border style="width: 100%">
        <el-table-column prop="serviceName" label="服务名称" min-width="140" />
        <el-table-column prop="owner" label="负责人" min-width="100" />
        <el-table-column prop="status" label="健康状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : row.status === '告警' ? 'warning' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastCheck" label="最近检查" min-width="160" />
        <el-table-column prop="desc" label="描述" min-width="180" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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
    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增服务' : '编辑服务'" width="500px">
      <el-form ref="healthFormRef" :model="healthForm" :rules="healthRules" label-width="90px">
        <el-form-item label="服务名称" prop="serviceName">
          <el-input v-model="healthForm.serviceName" placeholder="请输入服务名称" />
        </el-form-item>
        <el-form-item label="负责人" prop="owner">
          <el-input v-model="healthForm.owner" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="健康状态" prop="status">
          <el-select v-model="healthForm.status" placeholder="请选择健康状态" style="width: 140px">
            <el-option label="正常" value="正常" />
            <el-option label="异常" value="异常" />
            <el-option label="告警" value="告警" />
          </el-select>
        </el-form-item>
        <el-form-item label="最近检查" prop="lastCheck">
          <el-date-picker v-model="healthForm.lastCheck" type="datetime" placeholder="选择时间" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="描述" prop="desc">
          <el-input v-model="healthForm.desc" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import * as echarts from 'echarts'

interface HealthItem {
  id: number;
  serviceName: string;
  owner: string;
  status: string;
  lastCheck: string;
  desc: string;
}

const originalHealthList = ref<HealthItem[]>([
  { id: 1, serviceName: '政务门户', owner: '李明', status: '正常', lastCheck: '2025-04-01 09:00', desc: '门户网站运行正常' },
  { id: 2, serviceName: '人口管理', owner: '王芳', status: '告警', lastCheck: '2025-04-01 08:30', desc: '接口响应慢' },
  { id: 3, serviceName: '视频监控', owner: '赵强', status: '异常', lastCheck: '2025-03-31 17:00', desc: '部分摄像头离线' },
  { id: 4, serviceName: '数据共享', owner: '孙丽', status: '正常', lastCheck: '2025-03-31 16:00', desc: '数据同步正常' },
  { id: 5, serviceName: '应急指挥', owner: '周伟', status: '正常', lastCheck: '2025-03-30 14:00', desc: '服务稳定' },
  { id: 6, serviceName: '资产管理', owner: '马俊', status: '异常', lastCheck: '2025-03-29 11:00', desc: '数据库连接失败' },
  { id: 7, serviceName: '工单系统', owner: '许静', status: '正常', lastCheck: '2025-03-28 09:00', desc: '无异常' },
  { id: 8, serviceName: '能耗监控', owner: '宋倩', status: '告警', lastCheck: '2025-03-27 13:00', desc: '能耗超阈值' },
  { id: 9, serviceName: '安全事件', owner: '魏东', status: '正常', lastCheck: '2025-03-26 10:00', desc: '无安全告警' },
  { id: 10, serviceName: '备份任务', owner: '冯媛', status: '正常', lastCheck: '2025-03-25 15:00', desc: '备份完成' }
])
const healthList = ref<HealthItem[]>([])

const stat = reactive({ normal: 0, error: 0, warning: 0 })

const trendChartRef = ref<HTMLDivElement | null>(null)
const trendData = ref({
  days: ['3-26', '3-27', '3-28', '3-29', '3-30', '3-31', '4-1'],
  normal: [6, 6, 7, 7, 7, 7, 7],
  error: [2, 2, 2, 2, 2, 2, 1],
  warning: [2, 2, 1, 1, 1, 1, 2]
})

const searchForm = reactive({
  keyword: '',
  status: ''
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const healthFormRef = ref<FormInstance>()
const healthForm = reactive<HealthItem>({
  id: 0,
  serviceName: '',
  owner: '',
  status: '正常',
  lastCheck: '',
  desc: ''
})

const healthRules = {
  serviceName: [{ required: true, message: '请输入服务名称', trigger: 'blur' }],
  owner: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
  status: [{ required: true, message: '请选择健康状态', trigger: 'change' }],
  lastCheck: [{ required: true, message: '请选择最近检查时间', trigger: 'change' }]
}

const handleSearch = () => {
  let filtered = [...originalHealthList.value]
  if (searchForm.keyword) {
    filtered = filtered.filter(d => d.serviceName.includes(searchForm.keyword) || d.owner.includes(searchForm.keyword))
  }
  if (searchForm.status) {
    filtered = filtered.filter(d => d.status === searchForm.status)
  }
  total.value = filtered.length
  healthList.value = filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
  updateStat()
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  currentPage.value = 1
  handleSearch()
}

const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  healthForm.id = 0
  healthForm.serviceName = ''
  healthForm.owner = ''
  healthForm.status = '正常'
  healthForm.lastCheck = ''
  healthForm.desc = ''
}
const handleEdit = (row: HealthItem) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(healthForm, row)
}
const handleDelete = (row: HealthItem) => {
  ElMessageBox.confirm('确定要删除该服务吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const idx = originalHealthList.value.findIndex(d => d.id === row.id)
    if (idx !== -1) {
      originalHealthList.value.splice(idx, 1)
      handleSearch()
      ElMessage.success('删除成功')
    }
  })
}
const handleSubmit = async () => {
  if (!healthFormRef.value) return
  await healthFormRef.value.validate((valid) => {
    if (valid) {
      if (dialogType.value === 'add') {
        const newHealth = { ...healthForm, id: Date.now() }
        originalHealthList.value.unshift(newHealth)
        handleSearch()
        ElMessage.success('新增成功')
      } else {
        const idx = originalHealthList.value.findIndex(d => d.id === healthForm.id)
        if (idx !== -1) {
          originalHealthList.value[idx] = { ...healthForm, id: healthForm.id }
          handleSearch()
          ElMessage.success('修改成功')
        }
      }
      dialogVisible.value = false
    }
  })
}
const handleSizeChange = (val: number) => {
  pageSize.value = val
  handleSearch()
}
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  handleSearch()
}

function updateStat() {
  stat.normal = originalHealthList.value.filter(d => d.status === '正常').length
  stat.error = originalHealthList.value.filter(d => d.status === '异常').length
  stat.warning = originalHealthList.value.filter(d => d.status === '告警').length
}

function renderTrendChart() {
  if (!trendChartRef.value) return
  const chart = echarts.init(trendChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['正常', '异常', '告警'] },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: trendData.value.days },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      { name: '正常', type: 'line', data: trendData.value.normal, smooth: true, lineStyle: { color: '#67C23A' } },
      { name: '异常', type: 'line', data: trendData.value.error, smooth: true, lineStyle: { color: '#F56C6C' } },
      { name: '告警', type: 'line', data: trendData.value.warning, smooth: true, lineStyle: { color: '#E6A23C' } }
    ]
  })
}

onMounted(() => {
  handleSearch()
  updateStat()
  nextTick(() => {
    renderTrendChart()
  })
})
</script>

<style scoped>
.health-container {
  padding: 20px;
}
.health-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.stat-card {
  flex: 1;
  text-align: center;
  padding: 16px 0;
}
.stat-title {
  font-size: 15px;
  color: #888;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 32px;
  font-weight: bold;
}
.stat-value.normal {
  color: #67C23A;
}
.stat-value.error {
  color: #F56C6C;
}
.stat-value.warning {
  color: #E6A23C;
}
.trend-card {
  margin-bottom: 20px;
}
.trend-title {
  font-size: 15px;
  color: #888;
  margin-bottom: 8px;
}
.trend-chart {
  width: 100%;
  height: 260px;
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
.health-list {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
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
.el-button.is-link {
  background: none !important;
  border: none !important;
  color: var(--el-color-primary) !important;
  box-shadow: none !important;
  padding: 0 6px !important;
  min-width: 0 !important;
  font-size: 13px !important;
}
</style> 