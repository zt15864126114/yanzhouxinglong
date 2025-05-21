<template>
  <div class="backup-container">
    <!-- 顶部统计卡片（新版） -->
    <div class="backup-stats new-style">
      <div class="stat-card2 total">
        <div class="icon-block"><el-icon><DocumentCopy /></el-icon></div>
        <div class="stat-content">
          <div class="stat-title">总任务数</div>
          <div class="stat-value">{{ stat.total }}</div>
          <div class="stat-trend up">
            <el-icon><Top /></el-icon>
            0%
          </div>
        </div>
      </div>
      <div class="stat-card2 running">
        <div class="icon-block"><el-icon><Loading /></el-icon></div>
        <div class="stat-content">
          <div class="stat-title">运行中</div>
          <div class="stat-value">{{ stat.running }}</div>
          <div class="stat-trend up">
            <el-icon><Top /></el-icon>
            0%
          </div>
        </div>
      </div>
      <div class="stat-card2 completed">
        <div class="icon-block"><el-icon><CircleCheck /></el-icon></div>
        <div class="stat-content">
          <div class="stat-title">已完成</div>
          <div class="stat-value">{{ stat.completed }}</div>
          <div class="stat-trend up">
            <el-icon><Top /></el-icon>
            0%
          </div>
        </div>
      </div>
      <div class="stat-card2 failed">
        <div class="icon-block"><el-icon><CircleClose /></el-icon></div>
        <div class="stat-content">
          <div class="stat-title">失败</div>
          <div class="stat-value">{{ stat.failed }}</div>
          <div class="stat-trend down">
            <el-icon><Bottom /></el-icon>
            0%
          </div>
        </div>
      </div>
    </div>
    <div class="operation-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input v-model="searchForm.keyword" placeholder="任务名称/负责人/目标路径" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <el-button type="primary" @click="handleAdd">新建备份任务</el-button>
    </div>
    <el-card class="backup-list" shadow="hover">
      <el-table :data="backupList" border style="width: 100%">
        <el-table-column prop="name" label="任务名称" min-width="140" />
        <el-table-column prop="owner" label="负责人" min-width="100" />
        <el-table-column prop="type" label="类型" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'full' ? 'primary' : row.type === 'incremental' ? 'success' : 'warning'">
              {{ row.type === 'full' ? '全量备份' : row.type === 'incremental' ? '增量备份' : '差异备份' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'running' ? 'primary' : row.status === 'completed' ? 'success' : row.status === 'failed' ? 'danger' : 'info'">
              {{ row.status === 'running' ? '运行中' : row.status === 'completed' ? '已完成' : row.status === 'failed' ? '失败' : '等待中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastRunTime" label="备份时间" min-width="160" />
        <el-table-column prop="desc" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleRun(row)" :disabled="row.status === 'running'">执行</el-button>
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
    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新建备份任务' : '编辑备份任务'" width="600px">
      <el-form ref="backupFormRef" :model="backupForm" :rules="backupRules" label-width="100px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="backupForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="负责人" prop="owner">
          <el-input v-model="backupForm.owner" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="backupForm.type" placeholder="请选择备份类型" style="width: 100%">
            <el-option label="全量备份" value="full" />
            <el-option label="增量备份" value="incremental" />
            <el-option label="差异备份" value="differential" />
          </el-select>
        </el-form-item>
        <el-form-item label="源路径" prop="source">
          <el-input v-model="backupForm.source" placeholder="请输入源路径" />
        </el-form-item>
        <el-form-item label="目标路径" prop="target">
          <el-input v-model="backupForm.target" placeholder="请输入目标路径" />
        </el-form-item>
        <el-form-item label="执行计划" prop="schedule">
          <el-select v-model="backupForm.schedule" placeholder="请选择执行计划" style="width: 100%">
            <el-option label="每天" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="backupForm.schedule === 'custom'" label="自定义时间" prop="customTime">
          <el-time-picker v-model="backupForm.customTime" format="HH:mm" placeholder="选择时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述" prop="desc">
          <el-input v-model="backupForm.desc" placeholder="请输入描述" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { DocumentCopy, Loading, CircleCheck, CircleClose, Top, Bottom } from '@element-plus/icons-vue'

interface BackupItem {
  id: number;
  name: string;
  owner: string;
  type: 'full' | 'incremental' | 'differential';
  source: string;
  target: string;
  schedule: string;
  status: 'running' | 'completed' | 'failed' | 'waiting';
  progress: number;
  lastRunTime: string;
  desc: string;
  customTime?: string;
}

const stat = reactive({
  total: 0,
  running: 0,
  completed: 0,
  failed: 0
})

const originalBackupList = ref<BackupItem[]>([
  { id: 1, name: '数据库全量备份', owner: '李明', type: 'full', source: '/data/mysql', target: '/backup/mysql/full', schedule: 'daily', status: 'completed', progress: 100, lastRunTime: '2025-04-01 02:00', desc: '每日凌晨全量备份' },
  { id: 2, name: '文件服务器增量备份', owner: '王芳', type: 'incremental', source: '/data/files', target: '/backup/files/incremental', schedule: 'weekly', status: 'running', progress: 45, lastRunTime: '2025-04-01 03:00', desc: '文件服务器每周增量备份' },
  { id: 3, name: '应用系统差异备份', owner: '赵强', type: 'differential', source: '/data/apps', target: '/backup/apps/differential', schedule: 'monthly', status: 'failed', progress: 60, lastRunTime: '2025-04-01 04:00', desc: '应用系统每月差异备份' },
  { id: 4, name: '配置文件备份', owner: '孙丽', type: 'full', source: '/etc', target: '/backup/config', schedule: 'daily', status: 'waiting', progress: 0, lastRunTime: '2025-03-31 02:00', desc: '系统配置文件每日全量备份' },
  { id: 5, name: '日志文件备份', owner: '周伟', type: 'incremental', source: '/var/log', target: '/backup/logs', schedule: 'weekly', status: 'completed', progress: 100, lastRunTime: '2025-03-31 03:00', desc: '日志文件每周增量备份' }
])
const backupList = ref<BackupItem[]>([])

const searchForm = reactive({
  keyword: ''
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const backupFormRef = ref<FormInstance>()
const backupForm = reactive<BackupItem>({
  id: 0,
  name: '',
  owner: '',
  type: 'full',
  source: '',
  target: '',
  schedule: 'daily',
  status: 'waiting',
  progress: 0,
  lastRunTime: '',
  desc: '',
  customTime: ''
})

const backupRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  owner: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
  type: [{ required: true, message: '请选择备份类型', trigger: 'change' }],
  source: [{ required: true, message: '请输入源路径', trigger: 'blur' }],
  target: [{ required: true, message: '请输入目标路径', trigger: 'blur' }],
  schedule: [{ required: true, message: '请选择执行计划', trigger: 'change' }],
  desc: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  customTime: [{ required: true, message: '请选择自定义时间', trigger: 'change' }]
}

function updateStat() {
  stat.total = originalBackupList.value.length
  stat.running = originalBackupList.value.filter(d => d.status === 'running').length
  stat.completed = originalBackupList.value.filter(d => d.status === 'completed').length
  stat.failed = originalBackupList.value.filter(d => d.status === 'failed').length
}

function handleSearch() {
  let filtered = [...originalBackupList.value]
  if (searchForm.keyword) {
    filtered = filtered.filter(d => d.name.includes(searchForm.keyword) || d.owner.includes(searchForm.keyword) || d.target.includes(searchForm.keyword))
  }
  total.value = filtered.length
  backupList.value = filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
}

function resetSearch() {
  searchForm.keyword = ''
  currentPage.value = 1
  handleSearch()
}

function handleAdd() {
  dialogType.value = 'add'
  dialogVisible.value = true
  backupForm.id = 0
  backupForm.name = ''
  backupForm.owner = ''
  backupForm.type = 'full'
  backupForm.source = ''
  backupForm.target = ''
  backupForm.schedule = 'daily'
  backupForm.status = 'waiting'
  backupForm.progress = 0
  backupForm.lastRunTime = ''
  backupForm.desc = ''
  backupForm.customTime = ''
}

function handleEdit(row: BackupItem) {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(backupForm, row)
}

function handleDelete(row: BackupItem) {
  ElMessageBox.confirm('确定要删除该备份任务吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const idx = originalBackupList.value.findIndex(d => d.id === row.id)
    if (idx !== -1) {
      originalBackupList.value.splice(idx, 1)
      handleSearch()
      updateStat()
      ElMessage.success('删除成功')
    }
  })
}

function handleRun(row: BackupItem) {
  ElMessageBox.confirm('确定要立即执行该备份任务吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    const idx = originalBackupList.value.findIndex(d => d.id === row.id)
    if (idx !== -1) {
      originalBackupList.value[idx].status = 'running'
      originalBackupList.value[idx].progress = 0
      handleSearch()
      updateStat()
      ElMessage.success('任务已开始执行')
    }
  })
}

function handleSubmit() {
  if (!backupFormRef.value) return
  backupFormRef.value.validate((valid) => {
    if (valid) {
      if (dialogType.value === 'add') {
        const newBackup = { ...backupForm, id: Date.now() }
        originalBackupList.value.unshift(newBackup)
        handleSearch()
        updateStat()
        ElMessage.success('新增成功')
      } else {
        const idx = originalBackupList.value.findIndex(d => d.id === backupForm.id)
        if (idx !== -1) {
          originalBackupList.value[idx] = { ...backupForm }
          handleSearch()
          ElMessage.success('修改成功')
        }
      }
      dialogVisible.value = false
    }
  })
}

function handleSizeChange(val: number) {
  pageSize.value = val
  handleSearch()
}

function handleCurrentChange(val: number) {
  currentPage.value = val
  handleSearch()
}

onMounted(() => {
  handleSearch()
  updateStat()
})
</script>

<style scoped>
.backup-container {
  padding: 20px;
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
.backup-list {
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
.backup-stats.new-style {
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
  min-width: 220px;
  flex: 1 1 220px;
  max-width: 340px;
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
.stat-card2.running .icon-block { background: #67C23A; }
.stat-card2.completed .icon-block { background: #E6A23C; }
.stat-card2.failed .icon-block { background: #F56C6C; }
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
@media (max-width: 900px) {
  .backup-stats.new-style {
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