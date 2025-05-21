<template>
  <div class="system-container">
    <div class="operation-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input v-model="searchForm.keyword" placeholder="系统名称/负责人" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.status" placeholder="运行状态" clearable style="width: 140px">
            <el-option label="运行中" value="运行中" />
            <el-option label="异常" value="异常" />
            <el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-card class="system-list-card">
      <el-row :gutter="20">
        <el-col v-for="item in systemList" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="system-card" shadow="hover" @click="handleDetail(item)">
            <div class="sys-icon">
              <el-icon :size="32">
                <component :is="item.icon" />
              </el-icon>
            </div>
            <div class="sys-title">{{ item.systemName }}</div>
            <div class="sys-desc">{{ item.desc }}</div>
            <div class="sys-meta">
              <span class="sys-owner">负责人：{{ item.owner }}</span>
              <el-tag :type="item.status === '运行中' ? 'success' : item.status === '异常' ? 'danger' : 'info'" size="small">
                {{ item.status }}
              </el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>
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
    <el-drawer v-model="drawerVisible" title="系统详情" size="400px" direction="rtl">
      <div v-if="currentDetail">
        <div class="sys-detail-title">
          <el-icon :size="32" style="vertical-align: middle; margin-right: 8px;">
            <component :is="currentDetail.icon" />
          </el-icon>
          <span>{{ currentDetail.systemName }}</span>
        </div>
        <div class="sys-detail-meta">
          <el-tag :type="currentDetail.status === '运行中' ? 'success' : currentDetail.status === '异常' ? 'danger' : 'info'" size="small">
            {{ currentDetail.status }}
          </el-tag>
          <span style="margin-left: 16px;">负责人：{{ currentDetail.owner }}</span>
        </div>
        <div class="sys-detail-desc">{{ currentDetail.desc }}</div>
        <div class="sys-detail-update">更新时间：{{ currentDetail.updateTime }}</div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Monitor, Platform, Cpu, DataLine, Warning, Box, Folder, User, Calendar, DataAnalysis, Service, FirstAidKit, Connection } from '@element-plus/icons-vue'

interface SystemItem {
  id: number;
  systemName: string;
  owner: string;
  status: string;
  desc: string;
  updateTime: string;
  icon: any;
}

const originalSystemList = ref<SystemItem[]>([
  { id: 1, systemName: '社区人口管理', owner: '张建国', status: '运行中', desc: '社区居民信息管理、人口普查、流动人口管理', updateTime: '2025-04-01 09:00', icon: Monitor },
  { id: 2, systemName: '便民服务门户', owner: '李伟', status: '运行中', desc: '街道便民服务网站、在线办事、政策咨询', updateTime: '2025-04-01 08:30', icon: Platform },
  { id: 3, systemName: '社区监控平台', owner: '王芳', status: '运行中', desc: '社区安全监控、智能门禁、车辆管理', updateTime: '2025-03-31 17:00', icon: Warning },
  { id: 4, systemName: '网格化管理平台', owner: '赵明', status: '运行中', desc: '社区网格化管理、事件处置、巡查管理', updateTime: '2025-03-31 16:00', icon: DataLine },
  { id: 5, systemName: '应急指挥系统', owner: '陈静', status: '运行中', desc: '社区应急指挥、突发事件处置、应急预案管理', updateTime: '2025-03-30 14:00', icon: Box },
  { id: 6, systemName: '社区资产管理', owner: '刘强', status: '运行中', desc: '社区公共设施、固定资产、物资管理', updateTime: '2025-03-29 11:00', icon: Folder },
  { id: 7, systemName: '便民服务工单', owner: '孙丽', status: '运行中', desc: '居民服务工单、投诉建议、满意度评价', updateTime: '2025-03-28 09:00', icon: Cpu },
  { id: 8, systemName: '社区能耗监控', owner: '周伟', status: '运行中', desc: '社区能耗监测、节能管理、费用统计', updateTime: '2025-03-27 13:00', icon: DataLine },
  { id: 9, systemName: '社区安全事件', owner: '马俊', status: '运行中', desc: '社区安全事件、隐患排查、整改跟踪', updateTime: '2025-03-26 10:00', icon: Warning },
  { id: 10, systemName: '数据备份系统', owner: '许静', status: '运行中', desc: '系统数据备份、容灾恢复、安全存储', updateTime: '2025-03-25 15:00', icon: Folder },
  { id: 11, systemName: '社区养老服务', owner: '宋倩', status: '运行中', desc: '老年人关爱服务、居家养老、助老服务', updateTime: '2025-03-24 15:00', icon: User },
  { id: 12, systemName: '社区文化活动', owner: '魏东', status: '运行中', desc: '社区文化活动、居民教育、文体活动', updateTime: '2025-03-23 14:00', icon: Calendar },
  { id: 13, systemName: '社区环境监测', owner: '冯媛', status: '运行中', desc: '社区环境监测、垃圾分类、卫生管理', updateTime: '2025-03-22 13:00', icon: DataAnalysis },
  { id: 14, systemName: '社区志愿服务', owner: '张丽', status: '运行中', desc: '志愿者服务管理、活动组织、积分管理', updateTime: '2025-03-21 12:00', icon: Service },
  { id: 15, systemName: '社区医疗健康', owner: '李华', status: '运行中', desc: '社区医疗服务、健康档案、慢病管理', updateTime: '2025-03-20 11:00', icon: FirstAidKit },
  { id: 16, systemName: '超融合节点管理', owner: '张建国', status: '运行中', desc: '超融合节点服务器管理、资源监控、性能优化', updateTime: '2025-03-19 10:00', icon: Cpu },
  { id: 17, systemName: '分布式存储管理', owner: '张建国', status: '运行中', desc: '分布式存储池管理、容量监控、数据冗余', updateTime: '2025-03-18 09:00', icon: Folder },
  { id: 18, systemName: '网络设备管理', owner: '张建国', status: '运行中', desc: '万兆核心交换机管理、VLAN配置、流量监控', updateTime: '2025-03-17 08:00', icon: Connection }
])
const systemList = ref<SystemItem[]>([])

const searchForm = reactive({
  keyword: '',
  status: ''
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const drawerVisible = ref(false)
const currentDetail = ref<SystemItem | null>(null)

const handleSearch = () => {
  let filtered = [...originalSystemList.value]
  if (searchForm.keyword) {
    filtered = filtered.filter(d => d.systemName.includes(searchForm.keyword) || d.owner.includes(searchForm.keyword))
  }
  if (searchForm.status) {
    filtered = filtered.filter(d => d.status === searchForm.status)
  }
  total.value = filtered.length
  systemList.value = filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  currentPage.value = 1
  handleSearch()
}

const handleDetail = (item: SystemItem) => {
  currentDetail.value = item
  drawerVisible.value = true
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
.system-container {
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
.system-list-card {
  margin-bottom: 20px;
}
.system-card {
  cursor: pointer;
  margin-bottom: 20px;
  border-radius: 10px;
  transition: box-shadow 0.2s;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
}
.system-card:hover {
  box-shadow: 0 4px 16px rgba(64,158,255,0.15);
}
.sys-icon {
  margin-bottom: 8px;
  color: #409EFF;
}
.sys-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
}
.sys-desc {
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
}
.sys-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
}
.sys-owner {
  font-size: 13px;
  color: #666;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.sys-detail-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}
.sys-detail-meta {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sys-detail-desc {
  font-size: 15px;
  color: #666;
  margin-bottom: 12px;
}
.sys-detail-update {
  font-size: 13px;
  color: #999;
}
</style> 