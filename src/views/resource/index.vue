<template>
  <div class="resource-container">
    <!-- 搜索和操作栏 -->
    <div class="operation-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input v-model="searchForm.keyword" placeholder="资源名称/编号" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.type" placeholder="资源类型" clearable style="width: 140px">
            <el-option label="计算资源" value="compute" />
            <el-option label="存储资源" value="storage" />
            <el-option label="网络资源" value="network" />
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
      <el-tag v-if="searchForm.type" type="info" closable @close="() => clearFilter('type')">
        类型：{{ getTypeName(searchForm.type) }}
      </el-tag>
      <el-tag v-if="searchForm.keyword" type="info" closable @close="() => clearFilter('keyword')">
        关键词：{{ searchForm.keyword }}
      </el-tag>
      <el-button v-if="hasFilter" size="small" type="text" @click="resetSearch">清除全部</el-button>
    </el-row>
    <!-- 资源列表 -->
    <el-card class="resource-list">
      <el-button type="primary" @click="handleAdd" style="margin-bottom: 12px;">新增资源</el-button>
      <el-table :data="resourceList" border style="width: 100%">
        <el-table-column prop="name" label="资源名称" min-width="120" />
        <el-table-column prop="code" label="资源编号" min-width="120" />
        <el-table-column prop="type" label="类型" min-width="100">
          <template #default="{ row }">
            <el-tag>{{ getTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '可用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="负责人" min-width="120" />
        <el-table-column prop="createTime" label="添加时间" min-width="160" />
        <el-table-column label="操作" width="260">
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
    <!-- 资源表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增资源' : '编辑资源'" width="500px">
      <el-form ref="resourceFormRef" :model="resourceForm" :rules="resourceRules" label-width="90px">
        <el-form-item label="资源名称" prop="name">
          <el-input v-model="resourceForm.name" placeholder="请输入资源名称" />
        </el-form-item>
        <el-form-item label="资源编号" prop="code">
          <el-input v-model="resourceForm.code" placeholder="请输入资源编号" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="resourceForm.type" placeholder="请选择类型" style="width: 140px">
            <el-option label="计算资源" value="compute" />
            <el-option label="存储资源" value="storage" />
            <el-option label="网络资源" value="network" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="resourceForm.status" placeholder="请选择状态" style="width: 140px">
            <el-option label="可用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="owner">
          <el-input v-model="resourceForm.owner" placeholder="请输入负责人" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

interface ResourceItem {
  id: number;
  name: string;
  code: string;
  type: string;
  status: string;
  owner: string;
  createTime: string;
}

const originalResourceList = ref<ResourceItem[]>([
  { id: 1, name: '高性能计算节点', code: 'CMP-001', type: 'compute', status: 'active', owner: '张建国', createTime: '2025-03-20 10:00:00' },
  { id: 2, name: '虚拟机资源池', code: 'CMP-002', type: 'compute', status: 'active', owner: '李伟', createTime: '2025-03-19 09:00:00' },
  { id: 3, name: '企业级存储阵列', code: 'STO-001', type: 'storage', status: 'active', owner: '王芳', createTime: '2025-03-18 14:00:00' },
  { id: 4, name: '分布式备份存储', code: 'STO-002', type: 'storage', status: 'inactive', owner: '赵明', createTime: '2025-03-17 11:00:00' },
  { id: 5, name: '核心交换网络', code: 'NET-001', type: 'network', status: 'active', owner: '陈静', createTime: '2025-03-16 10:00:00' },
  { id: 6, name: '政务专网链路', code: 'NET-002', type: 'network', status: 'inactive', owner: '刘红', createTime: '2025-03-15 09:00:00' },
  { id: 7, name: '办公自动化云桌面', code: 'CMP-003', type: 'compute', status: 'active', owner: '杨伟', createTime: '2025-03-14 15:00:00' },
  { id: 8, name: '政务云对象存储', code: 'STO-003', type: 'storage', status: 'active', owner: '张力', createTime: '2025-03-13 13:00:00' },
  { id: 9, name: '互联网出口带宽', code: 'NET-003', type: 'network', status: 'active', owner: '王华', createTime: '2025-03-12 10:00:00' },
  { id: 10, name: '政务数据同步通道', code: 'NET-004', type: 'network', status: 'inactive', owner: '李霞', createTime: '2025-03-11 08:00:00' }
])
const resourceList = ref<ResourceItem[]>([])

const searchForm = reactive({
  keyword: '',
  type: ''
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const resourceFormRef = ref<FormInstance>()
const resourceForm = reactive<ResourceItem>({
  id: 0,
  name: '',
  code: '',
  type: '',
  status: 'active',
  owner: '',
  createTime: ''
})

const resourceRules = {
  name: [{ required: true, message: '请输入资源名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入资源编号', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  owner: [{ required: true, message: '请输入负责人', trigger: 'blur' }]
}

const hasFilter = computed(() => !!searchForm.type || !!searchForm.keyword)

const getTypeName = (type: string) => {
  if (type === 'compute') return '计算资源'
  if (type === 'storage') return '存储资源'
  if (type === 'network') return '网络资源'
  return type
}
const clearFilter = (key: 'type' | 'keyword') => {
  searchForm[key] = ''
  currentPage.value = 1
  handleSearch()
}

const handleSearch = () => {
  let filtered = [...originalResourceList.value]
  if (searchForm.keyword) {
    filtered = filtered.filter(d => d.name.includes(searchForm.keyword) || d.code.includes(searchForm.keyword))
  }
  if (searchForm.type) {
    filtered = filtered.filter(d => d.type === searchForm.type)
  }
  total.value = filtered.length
  resourceList.value = filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
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
  resourceForm.id = 0
  resourceForm.name = ''
  resourceForm.code = ''
  resourceForm.type = ''
  resourceForm.status = 'active'
  resourceForm.owner = ''
  resourceForm.createTime = ''
}
const handleEdit = (row: ResourceItem) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(resourceForm, row)
}
const handleDelete = (row: ResourceItem) => {
  ElMessageBox.confirm('确定要删除该资源吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const idx = originalResourceList.value.findIndex(d => d.id === row.id)
    if (idx !== -1) {
      originalResourceList.value.splice(idx, 1)
      handleSearch()
      ElMessage.success('删除成功')
    }
  })
}
const handleSubmit = async () => {
  if (!resourceFormRef.value) return
  await resourceFormRef.value.validate((valid) => {
    if (valid) {
      if (dialogType.value === 'add') {
        const newResource = { ...resourceForm, id: Date.now(), createTime: new Date().toLocaleString() }
        originalResourceList.value.unshift(newResource)
        handleSearch()
        ElMessage.success('新增成功')
      } else {
        const idx = originalResourceList.value.findIndex(d => d.id === resourceForm.id)
        if (idx !== -1) {
          originalResourceList.value[idx] = { ...resourceForm, id: resourceForm.id, createTime: resourceForm.createTime }
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
.resource-container {
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
.resource-list {
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