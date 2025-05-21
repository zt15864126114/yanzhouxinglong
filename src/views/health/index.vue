<template>
  <div class="health-root">
    <!-- 顶部仪表盘统计区 -->
    <div class="dashboard">
      <div class="stat-card" v-for="item in statCards" :key="item.label">
        <el-progress type="circle" :percentage="item.percent" :color="item.color" :width="54" :stroke-width="6" :show-text="false" />
        <div class="stat-label">{{ item.label }}</div>
        <div class="stat-value" :style="{color: item.color}">{{ item.value }}</div>
      </div>
      <div class="stat-card total">
        <div class="stat-label">服务总数</div>
        <div class="stat-value">{{ stat.total }}</div>
      </div>
      <div class="stat-card healthrate">
        <div class="stat-label">健康率</div>
        <div class="stat-value healthrate">{{ healthRate }}%</div>
      </div>
      <div class="stat-search">
        <el-input v-model="searchForm.keyword" placeholder="服务名称/负责人" clearable @keyup.enter="handleSearch" size="small" />
        <el-select v-model="searchForm.status" placeholder="健康状态" clearable size="small" style="width: 110px; margin-left: 8px;">
          <el-option label="全部" value="" />
          <el-option label="正常" value="正常" />
          <el-option label="异常" value="异常" />
          <el-option label="告警" value="告警" />
        </el-select>
        <el-button type="primary" size="small" @click="handleSearch" style="margin-left: 8px;">搜索</el-button>
      </div>
    </div>
    <!-- 主体卡片区 -->
    <div class="card-masonry">
      <el-empty v-if="!healthList.length" description="暂无服务" />
      <div v-else class="masonry-grid">
        <div v-for="item in healthList" :key="item.id" class="health-card">
          <div class="card-header">
            <span class="status-dot" :class="item.status"></span>
            <span class="service-name">{{ item.serviceName }}</span>
            <span class="owner">{{ item.owner }}</span>
          </div>
          <div class="card-desc" :title="item.desc">{{ item.desc }}</div>
          <div class="card-footer">
            <span class="last-check">最近检查：{{ item.lastCheck }}</span>
            <div class="card-actions">
              <el-button type="primary" link size="small" @click="handleDetail(item)">详情</el-button>
              <el-button type="success" link size="small" @click="handleEdit(item)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(item)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 分页 -->
    <div class="pagination center">
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
    <!-- 新增/编辑服务弹窗 -->
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
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
    <!-- 详情弹窗 -->
    <el-drawer v-model="detailDrawerVisible" title="服务详情" size="400px" direction="rtl" @close="onDrawerClose">
      <div v-if="currentDetail">
        <div class="drawer-title">{{ currentDetail.serviceName }}</div>
        <div class="drawer-row"><b>负责人：</b>{{ currentDetail.owner }}</div>
        <div class="drawer-row"><b>健康状态：</b><el-tag :type="getStatusTag(currentDetail.status)">{{ currentDetail.status }}</el-tag></div>
        <div class="drawer-row"><b>最近检查：</b>{{ currentDetail.lastCheck }}</div>
        <div class="drawer-row"><b>描述：</b>{{ currentDetail.desc }}</div>
      </div>
    </el-drawer>
    <!-- 新增服务悬浮按钮 -->
    <el-button class="fab" type="primary" circle @click="handleAdd"><el-icon><Plus /></el-icon></el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { FormInstance } from 'element-plus'

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

const stat = reactive({ normal: 0, error: 0, warning: 0, total: 0 })
const statCards = computed(() => [
  { label: '正常', value: stat.normal, percent: stat.total ? Math.round(stat.normal/stat.total*100) : 0, color: '#67C23A', status: '正常' },
  { label: '异常', value: stat.error, percent: stat.total ? Math.round(stat.error/stat.total*100) : 0, color: '#F56C6C', status: '异常' },
  { label: '告警', value: stat.warning, percent: stat.total ? Math.round(stat.warning/stat.total*100) : 0, color: '#E6A23C', status: '告警' }
])
const healthRate = computed(() => stat.total ? Math.round(stat.normal/stat.total*100) : 0)

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
const formLoading = ref(false)

const detailDrawerVisible = ref(false)
const currentDetail = ref<HealthItem | null>(null)

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
  formLoading.value = true
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
    formLoading.value = false
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
const handleDetail = (row: HealthItem) => {
  currentDetail.value = row
  detailDrawerVisible.value = true
}
function updateStat() {
  stat.normal = originalHealthList.value.filter(d => d.status === '正常').length
  stat.error = originalHealthList.value.filter(d => d.status === '异常').length
  stat.warning = originalHealthList.value.filter(d => d.status === '告警').length
  stat.total = originalHealthList.value.length
}
function getStatusTag(status: string) {
  if (status === '正常') return 'success'
  if (status === '异常') return 'danger'
  if (status === '告警') return 'warning'
  return 'info'
}
function onDrawerClose() {
  currentDetail.value = null
}
onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.health-root {
  max-width: 1700px;
  margin: 0 auto;
  padding: 24px 16px 40px 16px;
  background: #f6f8fa;
  min-height: 100vh;
}
.dashboard {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.stat-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px 0 rgba(0,0,0,0.04);
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
  min-height: 90px;
}
.stat-card.total {
  background: #f5f7fa;
  min-width: 80px;
}
.stat-card.healthrate {
  background: #f0f9eb;
  color: #67C23A;
  min-width: 90px;
}
.stat-label {
  font-size: 13px;
  color: #888;
  margin-top: 6px;
}
.stat-value {
  font-size: 22px;
  font-weight: bold;
  margin-top: 2px;
}
.stat-value.healthrate {
  font-size: 26px;
  color: #67C23A;
  font-weight: bold;
}
.stat-search {
  margin-left: auto;
  display: flex;
  align-items: center;
}
.card-masonry {
  min-height: 320px;
}
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}
.health-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 6px 0 rgba(0,0,0,0.06);
  padding: 18px 18px 12px 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  transition: box-shadow 0.2s, transform 0.2s;
  min-width: 0;
  min-height: 120px;
}
.health-card:hover {
  box-shadow: 0 4px 16px 0 rgba(64,158,255,0.12);
  transform: translateY(-2px) scale(1.01);
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 2px;
}
.status-dot.正常 {
  background: #67C23A;
}
.status-dot.异常 {
  background: #F56C6C;
}
.status-dot.告警 {
  background: #E6A23C;
}
.service-name {
  flex: 1;
  font-weight: bold;
}
.owner {
  color: #888;
  font-size: 13px;
}
.card-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
  min-height: 32px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
.card-desc:hover {
  white-space: normal;
  background: #f5f7fa;
  z-index: 2;
  position: relative;
  border-radius: 4px;
  padding: 2px 4px;
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #999;
  margin-top: 8px;
}
.card-actions {
  display: flex;
  gap: 6px;
}
.last-check {
  color: #bbb;
}
.pagination.center {
  justify-content: center;
  display: flex;
}
.fab {
  position: fixed;
  right: 36px;
  bottom: 36px;
  z-index: 10;
  box-shadow: 0 2px 12px 0 rgba(64,158,255,0.18);
}
.drawer-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 12px;
}
.drawer-row {
  margin-bottom: 10px;
  font-size: 15px;
}
@media (max-width: 900px) {
  .dashboard {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .masonry-grid {
    grid-template-columns: 1fr;
  }
}
.card-actions ::v-deep(.el-button--link) {
  background: none !important;
  border: none !important;
  color: inherit !important;
  box-shadow: none !important;
  min-width: 0 !important;
  padding: 0 8px !important;
  font-size: 14px !important;
  display: inline-block !important;
}
.card-actions ::v-deep(.el-button--primary),
.card-actions ::v-deep(.el-button--success),
.card-actions ::v-deep(.el-button--danger) {
  background: none !important;
  color: inherit !important;
}
.card-actions ::v-deep(.el-button--link:active),
.card-actions ::v-deep(.el-button--link:focus),
.card-actions ::v-deep(.el-button--link:hover) {
  background: none !important;
  color: var(--el-color-primary) !important;
  text-decoration: underline !important;
}
</style> 