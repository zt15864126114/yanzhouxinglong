<template>
  <div class="ticket-container">
    <div class="operation-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input v-model="searchForm.keyword" placeholder="工单标题/处理人" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.type" placeholder="工单类型" clearable style="width: 120px">
            <el-option label="故障报修" value="故障报修" />
            <el-option label="巡检" value="巡检" />
            <el-option label="升级" value="升级" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-card class="ticket-list">
      <el-button type="primary" link @click="handleAdd" style="margin-bottom: 12px;">新增工单</el-button>
      <el-table :data="ticketList" border style="width: 100%">
        <el-table-column prop="title" label="工单标题" min-width="140" />
        <el-table-column prop="type" label="工单类型" min-width="100" />
        <el-table-column prop="handler" label="处理人" min-width="100" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已完成' ? 'success' : row.status === '处理中' ? 'warning' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理进度" min-width="180">
          <template #default="{ row }">
            <el-steps :active="row.progress" finish-status="success" simple>
              <el-step title="已派单" />
              <el-step title="处理中" />
              <el-step title="已完成" />
            </el-steps>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="160" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            <el-button type="info" link @click="handleDetail(row)">详情</el-button>
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
    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增工单' : '编辑工单'" width="500px">
      <el-form ref="ticketFormRef" :model="ticketForm" :rules="ticketRules" label-width="90px">
        <el-form-item label="工单标题" prop="title">
          <el-input v-model="ticketForm.title" placeholder="请输入工单标题" />
        </el-form-item>
        <el-form-item label="工单类型" prop="type">
          <el-select v-model="ticketForm.type" placeholder="请选择工单类型" style="width: 140px">
            <el-option label="故障报修" value="故障报修" />
            <el-option label="巡检" value="巡检" />
            <el-option label="升级" value="升级" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理人" prop="handler">
          <el-input v-model="ticketForm.handler" placeholder="请输入处理人" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="ticketForm.status" placeholder="请选择状态" style="width: 140px">
            <el-option label="待处理" value="待处理" />
            <el-option label="处理中" value="处理中" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间" prop="createTime">
          <el-date-picker v-model="ticketForm.createTime" type="datetime" placeholder="选择时间" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="detailVisible" title="工单详情" width="600px" :before-close="() => detailVisible = false">
      <div v-if="currentDetail">
        <p><b>工单标题：</b>{{ currentDetail.title }}</p>
        <p><b>工单类型：</b>{{ currentDetail.type }}</p>
        <p><b>处理人：</b>{{ currentDetail.handler }}</p>
        <p><b>状态：</b>{{ currentDetail.status }}</p>
        <p><b>创建时间：</b>{{ currentDetail.createTime }}</p>
        <p><b>处理进度：</b></p>
        <el-steps :active="currentDetail.progress" finish-status="success">
          <el-step title="已派单" />
          <el-step title="处理中" />
          <el-step title="已完成" />
        </el-steps>
        <p style="margin-top: 16px;"><b>处理记录：</b></p>
        <el-timeline>
          <el-timeline-item v-for="(log, idx) in currentDetail.logs" :key="idx" :timestamp="log.time" :type="log.type">
            {{ log.content }}
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

interface TicketLog {
  time: string;
  content: string;
  type?: string;
}
interface TicketItem {
  id: number;
  title: string;
  type: string;
  handler: string;
  status: string;
  progress: number;
  createTime: string;
  logs: TicketLog[];
}

const originalTicketList = ref<TicketItem[]>([
  { id: 1, title: '主机故障报修', type: '故障报修', handler: '李明', status: '处理中', progress: 2, createTime: '2025-04-01 09:00', logs: [ { time: '2025-04-01 08:00', content: '工单已派单', type: 'info' }, { time: '2025-04-01 09:00', content: '正在处理', type: 'warning' } ] },
  { id: 2, title: '网络巡检', type: '巡检', handler: '王芳', status: '已完成', progress: 3, createTime: '2025-03-31 10:00', logs: [ { time: '2025-03-31 09:00', content: '工单已派单', type: 'info' }, { time: '2025-03-31 10:00', content: '巡检完成', type: 'success' } ] },
  { id: 3, title: '系统升级', type: '升级', handler: '赵强', status: '待处理', progress: 1, createTime: '2025-03-30 14:00', logs: [ { time: '2025-03-30 14:00', content: '工单已派单', type: 'info' } ] },
  { id: 4, title: '打印机故障', type: '故障报修', handler: '孙丽', status: '处理中', progress: 2, createTime: '2025-03-29 11:00', logs: [ { time: '2025-03-29 10:00', content: '工单已派单', type: 'info' }, { time: '2025-03-29 11:00', content: '正在处理', type: 'warning' } ] },
  { id: 5, title: '服务器巡检', type: '巡检', handler: '周伟', status: '已完成', progress: 3, createTime: '2025-03-28 09:00', logs: [ { time: '2025-03-28 08:00', content: '工单已派单', type: 'info' }, { time: '2025-03-28 09:00', content: '巡检完成', type: 'success' } ] },
  { id: 6, title: '数据库升级', type: '升级', handler: '马俊', status: '待处理', progress: 1, createTime: '2025-03-27 13:00', logs: [ { time: '2025-03-27 13:00', content: '工单已派单', type: 'info' } ] },
  { id: 7, title: '交换机故障', type: '故障报修', handler: '许静', status: '处理中', progress: 2, createTime: '2025-03-26 10:00', logs: [ { time: '2025-03-26 09:00', content: '工单已派单', type: 'info' }, { time: '2025-03-26 10:00', content: '正在处理', type: 'warning' } ] },
  { id: 8, title: '办公区巡检', type: '巡检', handler: '宋倩', status: '已完成', progress: 3, createTime: '2025-03-25 15:00', logs: [ { time: '2025-03-25 14:00', content: '工单已派单', type: 'info' }, { time: '2025-03-25 15:00', content: '巡检完成', type: 'success' } ] },
  { id: 9, title: '应用系统升级', type: '升级', handler: '魏东', status: '待处理', progress: 1, createTime: '2025-03-24 16:00', logs: [ { time: '2025-03-24 16:00', content: '工单已派单', type: 'info' } ] },
  { id: 10, title: '门禁系统故障', type: '故障报修', handler: '冯媛', status: '处理中', progress: 2, createTime: '2025-03-23 17:00', logs: [ { time: '2025-03-23 16:00', content: '工单已派单', type: 'info' }, { time: '2025-03-23 17:00', content: '正在处理', type: 'warning' } ] }
])
const ticketList = ref<TicketItem[]>([])

const searchForm = reactive({
  keyword: '',
  type: ''
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const ticketFormRef = ref<FormInstance>()
const ticketForm = reactive<TicketItem>({
  id: 0,
  title: '',
  type: '',
  handler: '',
  status: '待处理',
  progress: 1,
  createTime: '',
  logs: []
})

const detailVisible = ref(false)
const currentDetail = ref<TicketItem | null>(null)

const ticketRules = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
  handler: [{ required: true, message: '请输入处理人', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  createTime: [{ required: true, message: '请选择创建时间', trigger: 'change' }]
}

const handleSearch = () => {
  let filtered = [...originalTicketList.value]
  if (searchForm.keyword) {
    filtered = filtered.filter(d => d.title.includes(searchForm.keyword) || d.handler.includes(searchForm.keyword))
  }
  if (searchForm.type) {
    filtered = filtered.filter(d => d.type === searchForm.type)
  }
  total.value = filtered.length
  ticketList.value = filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.type = ''
  currentPage.value = 1
  handleSearch()
}

const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  ticketForm.id = 0
  ticketForm.title = ''
  ticketForm.type = ''
  ticketForm.handler = ''
  ticketForm.status = '待处理'
  ticketForm.progress = 1
  ticketForm.createTime = ''
  ticketForm.logs = []
}
const handleEdit = (row: TicketItem) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(ticketForm, row)
}
const handleDelete = (row: TicketItem) => {
  ElMessageBox.confirm('确定要删除该工单吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const idx = originalTicketList.value.findIndex(d => d.id === row.id)
    if (idx !== -1) {
      originalTicketList.value.splice(idx, 1)
      handleSearch()
      ElMessage.success('删除成功')
    }
  })
}
const handleDetail = (row: TicketItem) => {
  currentDetail.value = row
  detailVisible.value = true
}
const handleSubmit = async () => {
  if (!ticketFormRef.value) return
  await ticketFormRef.value.validate((valid) => {
    if (valid) {
      if (dialogType.value === 'add') {
        const newTicket = { ...ticketForm, id: Date.now(), logs: [ { time: ticketForm.createTime, content: '工单已派单', type: 'info' } ] }
        originalTicketList.value.unshift(newTicket)
        handleSearch()
        ElMessage.success('新增成功')
      } else {
        const idx = originalTicketList.value.findIndex(d => d.id === ticketForm.id)
        if (idx !== -1) {
          originalTicketList.value[idx] = { ...ticketForm, id: ticketForm.id }
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
onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.ticket-container {
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
.ticket-list {
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