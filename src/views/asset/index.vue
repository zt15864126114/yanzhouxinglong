<template>
  <div class="asset-container">
    <div class="operation-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input v-model="searchForm.keyword" placeholder="资产名称/编号/供应商" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.type" placeholder="资产类型" clearable style="width: 140px">
            <el-option label="网络设备" value="网络设备" />
            <el-option label="服务器" value="服务器" />
            <el-option label="存储设备" value="存储设备" />
            <el-option label="安全设备" value="安全设备" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-card class="asset-list">
      <el-button type="primary" @click="handleAdd" style="margin-bottom: 12px;">新增资产</el-button>
      <el-table :data="assetList" border style="width: 100%">
        <el-table-column prop="assetNo" label="资产编号" min-width="120" />
        <el-table-column prop="name" label="资产名称" min-width="120" />
        <el-table-column prop="type" label="类型" min-width="100" />
        <el-table-column prop="purchaseDate" label="采购日期" min-width="120" />
        <el-table-column prop="warranty" label="保修到期" min-width="120" />
        <el-table-column prop="vendor" label="供应商" min-width="120" />
        <el-table-column prop="price" label="价格" min-width="100" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '在用' ? 'success' : row.status === '报废' ? 'danger' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
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
    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增资产' : '编辑资产'" width="500px">
      <el-form ref="assetFormRef" :model="assetForm" :rules="assetRules" label-width="90px">
        <el-form-item label="资产编号" prop="assetNo">
          <el-input v-model="assetForm.assetNo" placeholder="请输入资产编号" />
        </el-form-item>
        <el-form-item label="资产名称" prop="name">
          <el-input v-model="assetForm.name" placeholder="请输入资产名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="assetForm.type" placeholder="请选择类型" style="width: 140px">
            <el-option label="网络设备" value="网络设备" />
            <el-option label="服务器" value="服务器" />
            <el-option label="存储设备" value="存储设备" />
            <el-option label="安全设备" value="安全设备" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购日期" prop="purchaseDate">
          <el-date-picker v-model="assetForm.purchaseDate" type="date" placeholder="选择日期" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="保修到期" prop="warranty">
          <el-date-picker v-model="assetForm.warranty" type="date" placeholder="选择日期" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="供应商" prop="vendor">
          <el-input v-model="assetForm.vendor" placeholder="请输入供应商" />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input v-model="assetForm.price" placeholder="请输入价格" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="assetForm.status" placeholder="请选择状态" style="width: 140px">
            <el-option label="在用" value="在用" />
            <el-option label="闲置" value="闲置" />
            <el-option label="报废" value="报废" />
          </el-select>
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

interface AssetItem {
  id: number;
  assetNo: string;
  name: string;
  type: string;
  purchaseDate: string;
  warranty: string;
  vendor: string;
  price: string;
  status: string;
}

const originalAssetList = ref<AssetItem[]>([
  { id: 1, assetNo: 'ZC2024001', name: '核心交换机-01', type: '网络设备', purchaseDate: '2025-01-10', warranty: '2026-01-10', vendor: '华为', price: '¥35000', status: '在用' },
  { id: 2, assetNo: 'ZC2024002', name: '应用服务器-01', type: '服务器', purchaseDate: '2025-02-15', warranty: '2026-02-15', vendor: '浪潮', price: '¥42000', status: '在用' },
  { id: 3, assetNo: 'ZC2024003', name: '存储阵列-01', type: '存储设备', purchaseDate: '2025-03-20', warranty: '2026-03-20', vendor: '华为', price: '¥60000', status: '闲置' },
  { id: 4, assetNo: 'ZC2024004', name: '防火墙-01', type: '安全设备', purchaseDate: '2025-04-05', warranty: '2026-04-05', vendor: '深信服', price: '¥25000', status: '在用' },
  { id: 5, assetNo: 'ZC2024005', name: '核心路由器-01', type: '网络设备', purchaseDate: '2025-05-12', warranty: '2026-05-12', vendor: '锐捷', price: '¥38000', status: '在用' },
  { id: 6, assetNo: 'ZC2024006', name: '应用服务器-02', type: '服务器', purchaseDate: '2025-06-18', warranty: '2026-06-18', vendor: '华为', price: '¥41000', status: '报废' },
  { id: 7, assetNo: 'ZC2024007', name: '备份存储-01', type: '存储设备', purchaseDate: '2025-07-22', warranty: '2026-07-22', vendor: '联想', price: '¥32000', status: '在用' },
  { id: 8, assetNo: 'ZC2024008', name: '负载均衡器-01', type: '网络设备', purchaseDate: '2025-08-30', warranty: '2026-08-30', vendor: 'F5', price: '¥28000', status: '闲置' },
  { id: 9, assetNo: 'ZC2024009', name: '安全网关-01', type: '安全设备', purchaseDate: '2025-09-10', warranty: '2026-09-10', vendor: '深信服', price: '¥23000', status: '在用' },
  { id: 10, assetNo: 'ZC2024010', name: '分布式存储-01', type: '存储设备', purchaseDate: '2025-10-15', warranty: '2026-10-15', vendor: '华为', price: '¥65000', status: '在用' }
])
const assetList = ref<AssetItem[]>([])

const searchForm = reactive({
  keyword: '',
  type: ''
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const assetFormRef = ref<FormInstance>()
const assetForm = reactive<AssetItem>({
  id: 0,
  assetNo: '',
  name: '',
  type: '',
  purchaseDate: '',
  warranty: '',
  vendor: '',
  price: '',
  status: '在用'
})

const assetRules = {
  assetNo: [{ required: true, message: '请输入资产编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入资产名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  purchaseDate: [{ required: true, message: '请选择采购日期', trigger: 'change' }],
  warranty: [{ required: true, message: '请选择保修到期', trigger: 'change' }],
  vendor: [{ required: true, message: '请输入供应商', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const handleSearch = () => {
  let filtered = [...originalAssetList.value]
  if (searchForm.keyword) {
    filtered = filtered.filter(d => d.name.includes(searchForm.keyword) || d.assetNo.includes(searchForm.keyword) || d.vendor.includes(searchForm.keyword))
  }
  if (searchForm.type) {
    filtered = filtered.filter(d => d.type === searchForm.type)
  }
  total.value = filtered.length
  assetList.value = filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
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
  assetForm.id = 0
  assetForm.assetNo = ''
  assetForm.name = ''
  assetForm.type = ''
  assetForm.purchaseDate = ''
  assetForm.warranty = ''
  assetForm.vendor = ''
  assetForm.price = ''
  assetForm.status = '在用'
}
const handleEdit = (row: AssetItem) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(assetForm, row)
}
const handleDelete = (row: AssetItem) => {
  ElMessageBox.confirm('确定要删除该资产吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const idx = originalAssetList.value.findIndex(d => d.id === row.id)
    if (idx !== -1) {
      originalAssetList.value.splice(idx, 1)
      handleSearch()
      ElMessage.success('删除成功')
    }
  })
}
const handleSubmit = async () => {
  if (!assetFormRef.value) return
  await assetFormRef.value.validate((valid) => {
    if (valid) {
      if (dialogType.value === 'add') {
        const newAsset = { ...assetForm, id: Date.now() }
        originalAssetList.value.unshift(newAsset)
        handleSearch()
        ElMessage.success('新增成功')
      } else {
        const idx = originalAssetList.value.findIndex(d => d.id === assetForm.id)
        if (idx !== -1) {
          originalAssetList.value[idx] = { ...assetForm, id: assetForm.id }
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
.asset-container {
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
.asset-list {
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
/* 强制修正 link 按钮为文字按钮风格 */
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