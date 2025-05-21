<template>
  <div class="data-container">
    <el-card class="data-card">
      <template #header>
        <div class="card-header">
          <h2>数据管理</h2>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="存储数据" name="storage">
          <div class="data-section">
            <el-row :gutter="20">
              <el-col :span="8" v-for="(item, index) in storageData" :key="index">
                <el-card class="storage-card">
                  <div class="storage-info">
                    <el-icon :size="40" class="storage-icon"><DataLine /></el-icon>
                    <div class="storage-details">
                      <h3>{{ item.name }}</h3>
                      <div class="storage-stats">
                        <el-progress 
                          :percentage="item.usagePercentage" 
                          :color="getProgressColor(item.usagePercentage)"
                        />
                        <span>已用空间: {{ item.used }} / {{ item.total }}</span>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="数据传输" name="transfer">
          <div class="data-section">
            <div class="table-header">
              <el-button type="primary" @click="showAddTransferDialog = true">
                添加数据传输任务
              </el-button>
            </div>
            <el-table :data="transferData" style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="name" label="任务名称" />
              <el-table-column prop="source" label="源位置" />
              <el-table-column prop="destination" label="目标位置" />
              <el-table-column prop="size" label="数据大小" />
              <el-table-column prop="status" label="状态">
                <template #default="scope">
                  <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="progress" label="进度">
                <template #default="scope">
                  <el-progress :percentage="scope.row.progress" />
                </template>
              </el-table-column>
              <el-table-column label="操作">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    type="primary" 
                    :disabled="scope.row.status === '已完成'"
                    @click="handleOperation(scope.row)"
                  >{{ scope.row.status === '暂停中' ? '继续' : '暂停' }}</el-button>
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="handleDelete(scope.row)"
                  >删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <el-dialog v-model="showAddTransferDialog" title="添加数据传输任务" width="500px">
      <el-form ref="transferForm" :model="newTransfer" label-width="120px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="newTransfer.name" placeholder="请输入任务名称"/>
        </el-form-item>
        <el-form-item label="源位置" prop="source">
          <el-input v-model="newTransfer.source" placeholder="请输入源位置" />
        </el-form-item>
        <el-form-item label="目标位置" prop="destination">
          <el-input v-model="newTransfer.destination" placeholder="请输入目标位置" />
        </el-form-item>
        <el-form-item label="数据大小" prop="size">
          <el-input v-model="newTransfer.size" placeholder="例如: 500GB" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddTransferDialog = false">取消</el-button>
          <el-button type="primary" @click="addTransferTask">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataLine } from '@element-plus/icons-vue'

// 定义数据类型接口
interface StorageItem {
  name: string;
  used: string;
  total: string;
  usagePercentage: number;
}

interface TransferItem {
  id: number;
  name: string;
  source: string;
  destination: string;
  size: string;
  status: string;
  progress: number;
}

// 当前选中的标签页
const activeTab = ref('storage')

// 存储数据
const storageData = ref<StorageItem[]>([
  { name: '政务云主存储', used: '28.3TB', total: '50TB', usagePercentage: 57 },
  { name: '政务云备份存储', used: '12.5TB', total: '20TB', usagePercentage: 63 },
  { name: '业务数据库存储', used: '8.1TB', total: '10TB', usagePercentage: 81 },
  { name: '视频监控存储', used: '6.2TB', total: '8TB', usagePercentage: 78 },
  { name: '归档存储', used: '35.8TB', total: '50TB', usagePercentage: 72 },
  { name: '政务门户存储', used: '1.2TB', total: '5TB', usagePercentage: 24 },
  { name: 'OA系统存储', used: '2.7TB', total: '5TB', usagePercentage: 54 }
])

// 数据传输任务列表
const transferData = ref<TransferItem[]>([
  { id: 1, name: '政务数据同步', source: '/gov/data', destination: '/cloud/data', size: '1.2TB', status: '进行中', progress: 45 },
  { id: 2, name: '业务数据库备份', source: '/db/prod', destination: '/backup/db', size: '800GB', status: '已完成', progress: 100 },
  { id: 3, name: '视频监控归档', source: '/video/live', destination: '/archive/video', size: '2.5TB', status: '暂停中', progress: 0 },
  { id: 4, name: '用户数据迁移', source: '/user/old', destination: '/user/new', size: '500GB', status: '进行中', progress: 68 },
  { id: 5, name: '日志文件同步', source: '/logs/current', destination: '/logs/backup', size: '150GB', status: '已完成', progress: 100 },
  { id: 6, name: 'OA系统数据备份', source: '/oa/data', destination: '/backup/oa', size: '300GB', status: '进行中', progress: 33 },
  { id: 7, name: '门户网站镜像', source: '/portal', destination: '/mirror/portal', size: '200GB', status: '暂停中', progress: 0 }
])

// 进度条颜色计算
const getProgressColor = (percentage: number): string => {
  if (percentage < 70) return '#67C23A'
  if (percentage < 90) return '#E6A23C'
  return '#F56C6C'
}

// 状态类型映射
const getStatusType = (status: string): string => {
  switch (status) {
    case '已完成':
      return 'success'
    case '暂停中':
      return 'primary'
    case '进行中':
      return 'info'
    case '失败':
      return 'danger'
    default:
      return 'info'
  }
}

// 添加数据传输任务对话框
const showAddTransferDialog = ref(false)
const newTransfer = reactive({
  name: '',
  source: '',
  destination: '',
  size: ''
})

// 添加传输任务
const addTransferTask = (): void => {
  const id = transferData.value.length + 1
  transferData.value.push({
    id,
    name: newTransfer.name,
    source: newTransfer.source,
    destination: newTransfer.destination,
    size: newTransfer.size,
    status: '暂停中',
    progress: 0
  })
  
  ElMessage.success('已添加传输任务')
  showAddTransferDialog.value = false
  
  // 重置表单
  newTransfer.name = ''
  newTransfer.source = ''
  newTransfer.destination = ''
  newTransfer.size = ''
}

// 处理操作
const handleOperation = (row: TransferItem): void => {
  if (row.status === '暂停中') {
    row.status = '进行中'
    ElMessage.info(`继续任务: ${row.name}`)
    
    // 模拟进度增长
    if (row.progress < 100) {
      const timer = setInterval(() => {
        row.progress += 1
        if (row.progress >= 100) {
          row.progress = 100
          row.status = '已完成'
          clearInterval(timer)
        }
      }, 2000)
    }
  } else {
    row.status = '暂停中'
    ElMessage.success(`已暂停任务: ${row.name}`)
  }
}

// 删除任务
const handleDelete = (row: TransferItem): void => {
  ElMessageBox.confirm(
    `确认删除任务"${row.name}"吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      const index = transferData.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        transferData.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}
</script>

<style scoped>
.data-container {
  padding: 20px;
}

.data-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.data-section {
  margin-top: 20px;
}

.storage-card {
  height: 150px;
  margin-bottom: 20px;
}

.storage-info {
  display: flex;
  align-items: center;
}

.storage-icon {
  margin-right: 20px;
  color: #409EFF;
}

.storage-details {
  flex-grow: 1;
}

.storage-stats {
  margin-top: 15px;
}

.table-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
</style> 