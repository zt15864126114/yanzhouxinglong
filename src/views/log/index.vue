<template>
  <div class="log-container">
    <div class="operation-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input v-model="searchForm.keyword" placeholder="操作人/内容/类型" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.result" placeholder="结果" clearable style="width: 140px">
            <el-option label="成功" value="成功" />
            <el-option label="失败" value="失败" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-card class="log-list">
      <el-button type="primary" link @click="handleAdd" style="margin-bottom: 12px;">新增日志</el-button>
      <el-table :data="logList" border style="width: 100%">
        <el-table-column prop="operator" label="操作人" min-width="100" />
        <el-table-column prop="type" label="操作类型" min-width="120" />
        <el-table-column prop="content" label="操作内容" min-width="180" />
        <el-table-column prop="ip" label="IP地址" min-width="120" />
        <el-table-column prop="result" label="结果" min-width="80">
          <template #default="{ row }">
            <el-tag :type="row.result === '成功' ? 'success' : 'danger'">
              {{ row.result }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="操作时间" min-width="160" />
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
    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增日志' : '编辑日志'" width="500px">
      <el-form ref="logFormRef" :model="logForm" :rules="logRules" label-width="90px">
        <el-form-item label="操作人" prop="operator">
          <el-input v-model="logForm.operator" placeholder="请输入操作人" />
        </el-form-item>
        <el-form-item label="操作类型" prop="type">
          <el-input v-model="logForm.type" placeholder="请输入操作类型" />
        </el-form-item>
        <el-form-item label="操作内容" prop="content">
          <el-input v-model="logForm.content" placeholder="请输入操作内容" />
        </el-form-item>
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="logForm.ip" placeholder="请输入IP地址" />
        </el-form-item>
        <el-form-item label="结果" prop="result">
          <el-select v-model="logForm.result" placeholder="请选择结果" style="width: 140px">
            <el-option label="成功" value="成功" />
            <el-option label="失败" value="失败" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间" prop="time">
          <el-date-picker v-model="logForm.time" type="datetime" placeholder="选择时间" style="width: 100%;" />
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

interface LogItem {
  id: number;
  operator: string;
  type: string;
  content: string;
  ip: string;
  result: string;
  time: string;
}

const originalLogList = ref<LogItem[]>([
  { id: 1, operator: '李明', type: '登录', content: '用户登录系统', ip: '192.168.1.10', result: '成功', time: '2025-05-01 09:00' },
  { id: 2, operator: '王芳', type: '新增', content: '新增用户信息', ip: '192.168.1.11', result: '成功', time: '2025-05-01 08:30' },
  { id: 3, operator: '赵强', type: '删除', content: '删除设备记录', ip: '192.168.1.12', result: '失败', time: '2025-05-31 17:00' },
  { id: 4, operator: '孙丽', type: '修改', content: '修改资源信息', ip: '192.168.1.13', result: '成功', time: '2025-05-31 16:00' },
  { id: 5, operator: '周伟', type: '导出', content: '导出数据报表', ip: '192.168.1.14', result: '成功', time: '2025-05-30 14:00' },
  { id: 6, operator: '马俊', type: '备份', content: '执行数据备份', ip: '192.168.1.15', result: '失败', time: '2025-05-29 11:00' },
  { id: 7, operator: '许静', type: '恢复', content: '恢复备份数据', ip: '192.168.1.16', result: '成功', time: '2025-05-28 09:00' },
  { id: 8, operator: '宋倩', type: '告警', content: '处理安全告警', ip: '192.168.1.17', result: '成功', time: '2025-05-27 13:00' },
  { id: 9, operator: '魏东', type: '登录', content: '用户登录系统', ip: '192.168.1.18', result: '失败', time: '2025-05-26 10:00' },
  { id: 10, operator: '冯媛', type: '修改', content: '修改系统配置', ip: '192.168.1.19', result: '成功', time: '2025-05-25 15:00' }
])
const logList = ref<LogItem[]>([])

const searchForm = reactive({
  keyword: '',
  result: ''
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const logFormRef = ref<FormInstance>()
const logForm = reactive<LogItem>({
  id: 0,
  operator: '',
  type: '',
  content: '',
  ip: '',
  result: '成功',
  time: ''
})

const logRules = {
  operator: [{ required: true, message: '请输入操作人', trigger: 'blur' }],
  type: [{ required: true, message: '请输入操作类型', trigger: 'blur' }],
  content: [{ required: true, message: '请输入操作内容', trigger: 'blur' }],
  ip: [{ required: true, message: '请输入IP地址', trigger: 'blur' }],
  result: [{ required: true, message: '请选择结果', trigger: 'change' }],
  time: [{ required: true, message: '请选择操作时间', trigger: 'change' }]
}

const handleSearch = () => {
  let filtered = [...originalLogList.value]
  if (searchForm.keyword) {
    filtered = filtered.filter(d => d.operator.includes(searchForm.keyword) || d.content.includes(searchForm.keyword) || d.type.includes(searchForm.keyword))
  }
  if (searchForm.result) {
    filtered = filtered.filter(d => d.result === searchForm.result)
  }
  total.value = filtered.length
  logList.value = filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.result = ''
  currentPage.value = 1
  handleSearch()
}

const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  logForm.id = 0
  logForm.operator = ''
  logForm.type = ''
  logForm.content = ''
  logForm.ip = ''
  logForm.result = '成功'
  logForm.time = ''
}
const handleEdit = (row: LogItem) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(logForm, row)
}
const handleDelete = (row: LogItem) => {
  ElMessageBox.confirm('确定要删除该日志吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const idx = originalLogList.value.findIndex(d => d.id === row.id)
    if (idx !== -1) {
      originalLogList.value.splice(idx, 1)
      handleSearch()
      ElMessage.success('删除成功')
    }
  })
}
const handleSubmit = async () => {
  if (!logFormRef.value) return
  await logFormRef.value.validate((valid) => {
    if (valid) {
      if (dialogType.value === 'add') {
        const newLog = { ...logForm, id: Date.now() }
        originalLogList.value.unshift(newLog)
        handleSearch()
        ElMessage.success('新增成功')
      } else {
        const idx = originalLogList.value.findIndex(d => d.id === logForm.id)
        if (idx !== -1) {
          originalLogList.value[idx] = { ...logForm, id: logForm.id }
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
.log-container {
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
.log-list {
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