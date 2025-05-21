<template>
  <div class="user-container">
    <!-- 搜索和操作栏 -->
    <div class="operation-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input
            v-model="searchForm.keyword"
            placeholder="用户名/手机号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.role" placeholder="角色" clearable style="width: 140px">
            <el-option
              v-for="role in roleOptions"
              :key="role.value"
              :label="role.label"
              :value="role.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 140px">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="operation-buttons">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增用户
        </el-button>
        <el-button type="success" @click="handleRoleManage">
          <el-icon><Setting /></el-icon>角色管理
        </el-button>
      </div>
    </div>

    <!-- 筛选条件标签区 -->
    <el-row v-if="hasFilter" class="filter-tags" style="margin-bottom: 10px;">
      <el-tag v-if="searchForm.role" type="info" closable @close="() => clearFilter('role')">
        角色：{{ getRoleName(searchForm.role) }}
      </el-tag>
      <el-tag v-if="searchForm.status" type="info" closable @close="() => clearFilter('status')">
        状态：{{ searchForm.status === 'active' ? '启用' : '禁用' }}
      </el-tag>
      <el-tag v-if="searchForm.keyword" type="info" closable @close="() => clearFilter('keyword')">
        关键词：{{ searchForm.keyword }}
      </el-tag>
      <el-button v-if="hasFilter" size="small" type="text" @click="resetSearch">清除全部</el-button>
    </el-row>

    <!-- 用户列表 -->
    <el-card class="user-list">
      <el-table
        :data="userList"
        border
        style="width: 100%"
        highlight-current-row
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="name" label="姓名" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="role" label="角色" min-width="120">
          <template #default="{ row }">
            <el-tag
              :type="row.role === '系统管理员' ? 'danger' : row.role === '社区管理员' ? 'primary' : row.role === '网格员' ? 'warning' : row.role === '便民服务人员' ? 'success' : row.role === '养老服务专员' ? 'info' : row.role === '文化活动专员' ? 'success' : row.role === '环境监测员' ? 'warning' : row.role === '志愿服务管理员' ? 'primary' : row.role === '社区医生' ? 'success' : 'default'"
            >
              {{ getRoleName(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status"
              :active-value="'active'"
              :inactive-value="'inactive'"
              @click="() => handleStatusClick(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-dropdown>
              <el-button link>更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleEdit(row)">编辑</el-dropdown-item>
                  <el-dropdown-item @click="handlePermission(row)">权限</el-dropdown-item>
                  <el-dropdown-item divided @click="handleDelete(row)" style="color: red;">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
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

    <!-- 用户表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增用户' : '编辑用户'"
      width="500px"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option
              v-for="role in roleOptions"
              :key="role.value"
              :label="role.label"
              :value="role.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 用户权限分配对话框 -->
    <el-dialog v-model="permissionDialogVisible" title="分配权限" width="400px">
      <el-tree
        :data="permissionTree"
        show-checkbox
        node-key="id"
        :default-checked-keys="currentUserPermissions"
        :props="{ label: 'name', children: 'children' }"
        ref="userPermissionTreeRef"
      />
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUserPermission">保存</el-button>
      </template>
    </el-dialog>

    <!-- 角色管理对话框 -->
    <el-dialog
      v-model="roleDialogVisible"
      title="角色管理"
      width="800px"
    >
      <el-tabs v-model="activeRoleTab">
        <el-tab-pane label="角色列表" name="list">
          <div class="role-operation">
            <el-button type="primary" @click="handleAddRole">
              <el-icon><Plus /></el-icon>新增角色
            </el-button>
          </div>
          <el-table :data="roleList" border style="width: 100%">
            <el-table-column prop="name" label="角色名称" />
            <el-table-column prop="code" label="角色编码" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="createTime" label="创建时间" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <div class="table-actions">
                  <el-button type="primary" link @click="handleEditRole(row)">编辑</el-button>
                  <el-button type="primary" link @click="handleRolePermission(row)">权限</el-button>
                  <el-button type="danger" link @click="handleDeleteRole(row)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="权限配置" name="permission">
          <el-tree
            ref="permissionTreeRef"
            :data="permissionTree"
            show-checkbox
            node-key="id"
            :default-checked-keys="checkedPermissions"
            :props="{
              label: 'name',
              children: 'children'
            }"
          />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Setting } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'

// 搜索表单
const searchForm = reactive({
  keyword: '',
  role: '',
  status: ''
})

// 角色选项
const roleOptions = [
  { label: '系统管理员', value: '系统管理员' },
  { label: '社区管理员', value: '社区管理员' },
  { label: '网格员', value: '网格员' },
  { label: '便民服务人员', value: '便民服务人员' },
  { label: '养老服务专员', value: '养老服务专员' },
  { label: '文化活动专员', value: '文化活动专员' },
  { label: '环境监测员', value: '环境监测员' },
  { label: '志愿服务管理员', value: '志愿服务管理员' },
  { label: '社区医生', value: '社区医生' }
]

// 模拟数据
const mockUsers: User[] = [
  { username: 'wangxq', name: '王晓强', phone: '13953701245', email: 'wangxq@xinglongzhuang.gov.cn', department: '街道信息化办公室', position: '主任', role: '系统管理员', status: 'active', lastLogin: '2025-05-03 08:12', createTime: '2025-05-02 09:23' },
  { username: 'liwn', name: '李文娜', phone: '13853712561', email: 'liwn@xinglongzhuang.gov.cn', department: '街道信息化办公室', position: '副主任', role: '社区管理员', status: 'active', lastLogin: '2025-05-07 10:45', createTime: '2025-05-06 14:11' },
  { username: 'liuzhy', name: '刘志洋', phone: '18653734576', email: 'liuzhy@xinglongzhuang.gov.cn', department: '社区服务中心', position: '网格员', role: '网格员', status: 'active', lastLogin: '2025-05-10 16:08', createTime: '2025-05-09 13:37' },
  { username: 'zhanglm', name: '张丽敏', phone: '15053745652', email: 'zhanglm@xinglongzhuang.gov.cn', department: '便民服务中心', position: '便民服务人员', role: '便民服务人员', status: 'active', lastLogin: '2025-05-12 09:56', createTime: '2025-05-11 10:05' },
  { username: 'chengl', name: '陈国磊', phone: '15153756984', email: 'chengl@xinglongzhuang.gov.cn', department: '社区服务中心', position: '养老服务专员', role: '养老服务专员', status: 'active', lastLogin: '2025-05-15 11:22', createTime: '2025-05-14 08:44' },
  { username: 'sunxy', name: '孙晓宇', phone: '15253767690', email: 'sunxy@xinglongzhuang.gov.cn', department: '社区服务中心', position: '文化活动专员', role: '文化活动专员', status: 'active', lastLogin: '2025-05-16 15:33', createTime: '2025-05-15 16:18' },
  { username: 'zhoujl', name: '周建林', phone: '15353778901', email: 'zhoujl@xinglongzhuang.gov.cn', department: '社区服务中心', position: '环境监测员', role: '环境监测员', status: 'active', lastLogin: '2025-05-17 07:41', createTime: '2025-05-16 12:29' },
  { username: 'huangyy', name: '黄雅雯', phone: '15553789012', email: 'huangyy@xinglongzhuang.gov.cn', department: '社区服务中心', position: '志愿服务管理员', role: '志愿服务管理员', status: 'active', lastLogin: '2025-05-18 18:09', createTime: '2025-05-17 19:55' },
  { username: 'liuhh', name: '刘慧慧', phone: '15653790123', email: 'liuhh@xinglongzhuang.gov.cn', department: '社区卫生服务站', position: '社区医生', role: '社区医生', status: 'active', lastLogin: '2025-05-19 20:17', createTime: '2025-05-18 21:03' },
  { username: 'gaoyt', name: '高宇涛', phone: '15753791234', email: 'gaoyt@xinglongzhuang.gov.cn', department: '街道信息化办公室', position: '系统管理员', role: '系统管理员', status: 'active', lastLogin: '2025-05-20 13:28', createTime: '2025-05-19 14:39' }
]

// 展示用用户数据
const userList = ref<User[]>([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 用户表单
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const userFormRef = ref<FormInstance>()

// 用户表单类型
interface UserForm {
  id?: number
  username: string
  name: string
  phone: string
  email: string
  department: string
  position: string
  role: string
  status: string
  lastLogin: string
  createTime: string
}

// 用户类型
type User = {
  id: number
  username: string
  name: string
  phone: string
  email: string
  department: string
  position: string
  role: string
  status: string
  lastLogin: string
  createTime: string
}

// 用户表单
const userForm = reactive<UserForm>({
  id: 0,
  username: '',
  name: '',
  phone: '',
  email: '',
  department: '',
  position: '',
  role: '',
  status: '正常',
  lastLogin: '',
  createTime: ''
})

// 角色管理
const roleDialogVisible = ref(false)
const activeRoleTab = ref('list')
const roleList = ref<any[]>([])

// 权限树
const permissionTreeRef = ref()
const permissionTree = ref([
  {
    id: 1,
    name: '系统管理',
    children: [
      { id: 11, name: '用户管理' },
      { id: 12, name: '角色管理' },
      { id: 13, name: '权限管理' }
    ]
  },
  {
    id: 2,
    name: '设备管理',
    children: [
      { id: 21, name: '设备列表' },
      { id: 22, name: '设备监控' },
      { id: 23, name: '设备维护' }
    ]
  }
])
const checkedPermissions = ref([11, 21])

// 获取角色名称
const getRoleName = (role: string) => {
  const found = roleOptions.find(item => item.value === role)
  return found ? found.label : role
}

// 搜索
const handleSearch = () => {
  let filtered = [...mockUsers]
  if (searchForm.keyword) {
    filtered = filtered.filter(u =>
      u.username.includes(searchForm.keyword) ||
      u.phone.includes(searchForm.keyword)
    )
  }
  if (searchForm.role) {
    filtered = filtered.filter(u => u.role === searchForm.role)
  }
  if (searchForm.status) {
    filtered = filtered.filter(u => u.status === searchForm.status)
  }
  total.value = filtered.length
  userList.value = filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.role = ''
  searchForm.status = ''
  currentPage.value = 1
  handleSearch()
}

// 新增用户
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  Object.assign(userForm, {
    id: Date.now(),
    username: '',
    name: '',
    phone: '',
    email: '',
    department: '',
    position: '',
    role: '',
    status: '正常',
    lastLogin: '',
    createTime: ''
  })
}

// 编辑用户
const handleEdit = (row: User) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(userForm, row)
}

// 删除用户
const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    '确定要删除该用户吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 实现删除逻辑
    const idx = mockUsers.findIndex(u => u.id === row.id)
    if (idx !== -1) {
      mockUsers.splice(idx, 1)
      handleSearch()
      ElMessage.success('删除成功')
      total.value = mockUsers.length
    }
  })
}

// 修改用户状态
const handleStatusClick = (row: User) => {
  row.status = row.status === 'active' ? 'inactive' : 'active'
  const status = row.status === 'active' ? '启用' : '禁用'
  ElMessage.success(`已${status}用户：${row.username}`)
}

// 提交表单
const handleSubmit = async () => {
  if (!userFormRef.value) return
  await userFormRef.value.validate((valid) => {
    if (valid) {
      if (dialogType.value === 'add') {
        // 新增
        const newUser: User = { ...userForm, id: Date.now(), createTime: new Date().toLocaleString(), lastLogin: '' }
        mockUsers.unshift(newUser)
        handleSearch()
        ElMessage.success('新增成功')
      } else {
        // 编辑
        const idx = mockUsers.findIndex(u => u.id === userForm.id)
        if (idx !== -1) {
          mockUsers[idx] = { ...userForm, id: userForm.id as number, createTime: userForm.createTime, lastLogin: userForm.lastLogin }
          handleSearch()
          ElMessage.success('修改成功')
        }
      }
      dialogVisible.value = false
    }
  })
}

// 分页
const handleSizeChange = (val: number) => {
  pageSize.value = val
  handleSearch()
}
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  handleSearch()
}

// 角色管理
const handleRoleManage = () => {
  roleDialogVisible.value = true
}

// 新增角色
const handleAddRole = () => {
  ElMessageBox.prompt('请输入新角色名称', '新增角色', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^.{2,20}$/,
    inputErrorMessage: '角色名称长度为2-20个字符'
  }).then(({ value }) => {
    const newRole: any = {
      id: Date.now(),
      name: value,
      description: '',
      permissions: [],
      createTime: new Date().toLocaleString()
    }
    roleList.value.push(newRole)
    ElMessage.success('新增角色成功')
  })
}

// 编辑角色
const handleEditRole = (row: any) => {
  ElMessageBox.prompt('请输入新的角色名称', '编辑角色', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: row.name,
    inputPattern: /^.{2,20}$/,
    inputErrorMessage: '角色名称长度为2-20个字符'
  }).then(({ value }) => {
    row.name = value
    ElMessage.success('编辑角色成功')
  })
}

// 删除角色
const handleDeleteRole = (row: any) => {
  ElMessageBox.confirm(
    '确定要删除该角色吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const idx = roleList.value.findIndex(r => r.id === row.id)
    if (idx !== -1) {
      roleList.value.splice(idx, 1)
      ElMessage.success('删除成功')
    }
  })
}

// 角色权限
const handleRolePermission = (row: any) => {
  activeRoleTab.value = 'permission'
  // 模拟：切换到权限配置时，checkedPermissions 只显示该角色的权限
  checkedPermissions.value = [11, 21] // 可根据 row.code 模拟不同权限
  ElMessage.info(`为角色【${row.name}】分配权限（仅模拟）`)
}

// 用户权限
const permissionDialogVisible = ref(false)
const currentUserPermissions = ref<number[]>([])
const currentUserId = ref<number | null>(null)
const userPermissionTreeRef = ref()

const handlePermission = (row: typeof mockUsers[0]) => {
  currentUserId.value = row.id
  // 这里可以根据 row.id 获取该用户已有权限，暂时用默认模拟
  userPermissionTreeRef.value?.setCheckedKeys(['1', '1-1', '1-2'])
  permissionDialogVisible.value = true
}

const saveUserPermission = () => {
  // 这里可以将 currentUserPermissions.value 保存到用户数据中（前端模拟）
  ElMessage.success('权限已保存（仅模拟）')
  permissionDialogVisible.value = false
}

const hasFilter = computed(() =>
  !!searchForm.role || !!searchForm.status || !!searchForm.keyword
)

const clearFilter = (key: 'role' | 'status' | 'keyword') => {
  searchForm[key] = ''
  currentPage.value = 1
  handleSearch()
}

// 表单验证规则
const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.user-container {
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

.operation-buttons {
  display: flex;
  gap: 10px;
}

.user-list {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.role-operation {
  margin-bottom: 20px;
}

:deep(.el-tabs__content) {
  padding: 20px 0;
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

.filter-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.el-table__row:hover {
  background: #f5f7fa !important;
}
</style> 