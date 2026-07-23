<script setup lang="ts">
const auth = useAuthStore()
const router = useRouter()
const name = ref('')

function handleSubmit(): void {
  const trimmed = name.value.trim()
  if (!trimmed) return
  auth.login(trimmed)
  router.push('/')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#0b0d13] px-4">
    <form
      class="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl"
      @submit.prevent="handleSubmit"
    >
      <h1 class="mb-6 text-xl font-bold text-white">登入</h1>
      <label class="mb-2 block text-xs font-bold text-white/60">你的名字</label>
      <input
        v-model="name"
        type="text"
        placeholder="輸入名字"
        class="mb-6 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:bg-white/10 focus:outline-none"
      />
      <button
        type="submit"
        class="w-full rounded-full bg-gradient-to-b from-white to-slate-100 px-6 py-3 font-bold text-[#14151b] transition hover:-translate-y-px"
      >
        登入
      </button>
    </form>
  </div>
</template>
