import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory('/yanzhouzhengfu/'),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue')
    },
    {
      path: '/',
      component: () => import('@/views/layout/index.vue'),
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '首页', icon: 'House' }
        },
        {
          path: 'user',
          name: 'User',
          component: () => import('@/views/user/index.vue'),
          meta: { title: '用户管理', icon: 'User' }
        },
        {
          path: 'device',
          name: 'Device',
          component: () => import('@/views/device/index.vue'),
          meta: { title: '设备管理', icon: 'Monitor' }
        },
        {
          path: 'resource',
          name: 'Resource',
          component: () => import('@/views/resource/index.vue'),
          meta: { title: '资源管理', icon: 'Connection' }
        },
        {
          path: 'data',
          name: 'Data',
          component: () => import('@/views/data/index.vue'),
          meta: { title: '数据服务', icon: 'DataLine' }
        },
        {
          path: 'monitor',
          name: 'Monitor',
          component: () => import('@/views/monitor/index.vue'),
          meta: { title: '监控告警', icon: 'Warning' }
        },
        {
          path: 'asset',
          name: 'Asset',
          component: () => import('@/views/asset/index.vue'),
          meta: { title: '资产台账', icon: 'Suitcase' }
        },
        {
          path: 'ticket',
          name: 'Ticket',
          component: () => import('@/views/ticket/index.vue'),
          meta: { title: '运维工单', icon: 'Tickets' }
        },
        {
          path: 'health',
          name: 'Health',
          component: () => import('@/views/health/index.vue'),
          meta: { title: '服务健康', icon: 'CircleCheck' }
        },
        {
          path: 'system',
          name: 'System',
          component: () => import('@/views/system/index.vue'),
          meta: { title: '业务系统', icon: 'Cpu' }
        },
        {
          path: 'energy',
          name: 'Energy',
          component: () => import('@/views/energy/index.vue'),
          meta: { title: '能耗监控', icon: 'PieChart' }
        },
        {
          path: 'backup',
          name: 'Backup',
          component: () => import('@/views/backup/index.vue'),
          meta: { title: '备份任务', icon: 'DocumentCopy' }
        },
        {
          path: 'log',
          name: 'Log',
          component: () => import('@/views/log/index.vue'),
          meta: { title: '操作日志', icon: 'Document' }
        }
      ]
    }
  ]
})

export default router 
