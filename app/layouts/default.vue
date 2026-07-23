<script setup lang="ts">
const auth = useAuthStore()

function handleLogout(): void {
  auth.logout()
}
</script>

<template>
  <div class="min-h-screen">
    <header class="absolute top-0 right-0 z-10 flex items-center gap-3 px-6 py-4 text-sm text-white/70">
      <template v-if="auth.isLoggedIn">
        <span>{{ auth.displayName }}</span>
        <button class="underline hover:text-white" @click="handleLogout">登出</button>
      </template>
      <NuxtLink v-else to="/login" class="underline hover:text-white">登入</NuxtLink>
    </header>
    <NuxtPage />
  </div>
</template>
