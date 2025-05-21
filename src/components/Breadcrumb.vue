<template>
  <el-breadcrumb separator="/">
    <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.path">
      <span v-if="index === breadcrumbs.length - 1" class="no-redirect">{{ item.meta?.title }}</span>
      <a v-else @click.prevent="handleLink(item)">{{ item.meta?.title }}</a>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const breadcrumbs = ref<any[]>([])

const getBreadcrumb = () => {
  let matched = route.matched.filter(item => item.meta && item.meta.title)
  const first = matched[0]

  if (!first || first.path !== '/') {
    matched = [{ path: '/', meta: { title: '首页' } } as any].concat(matched)
  }

  breadcrumbs.value = matched
}

const handleLink = (item: any) => {
  router.push(item.path)
}

watch(
  () => route.path,
  () => getBreadcrumb(),
  { immediate: true }
)
</script>

<style scoped>
.no-redirect {
  color: #97a8be;
  cursor: text;
}
</style> 