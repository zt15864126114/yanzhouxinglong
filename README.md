# 超融合平台

基于 Vue3 + TypeScript + Element Plus 的超融合平台前端项目。

## 功能特性

- 用户管理：用户注册、权限管理
- 设备管理：网络设备、服务器设备、存储设备管理
- 资源管理：资源分配、资源回收
- 数据服务：数据存储、数据传输
- 监控告警：设备监控、告警管理

## 技术栈

- Vue 3
- TypeScript
- Element Plus
- Vue Router
- Pinia
- ECharts
- Axios

## 开发环境要求

- Node.js >= 16
- npm >= 7

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

## 项目结构

```
src/
  ├── api/          # API 接口
  ├── assets/       # 静态资源
  ├── components/   # 公共组件
  ├── router/       # 路由配置
  ├── store/        # 状态管理
  ├── styles/       # 全局样式
  ├── utils/        # 工具函数
  ├── views/        # 页面组件
  ├── App.vue       # 根组件
  └── main.ts       # 入口文件
```

## 开发规范

- 使用 TypeScript 进行开发
- 遵循 Vue3 组合式 API 风格
- 使用 ESLint 进行代码规范检查
- 使用 Prettier 进行代码格式化

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88
