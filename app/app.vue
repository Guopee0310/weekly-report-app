<template>
  <div>
    <NuxtLayout>
      <NuxtPage v-slot="{ Component }">
        <Suspense>
          <template #default>
            <Transition name="page-enter" appear>
              <component :is="Component" />
            </Transition>
          </template>
          <template #fallback>
            <div class="report-bg boot-screen min-h-screen">
              <img src="/fav-icon.png" alt="" class="boot-mark" />
            </div>
          </template>
        </Suspense>
      </NuxtPage>
    </NuxtLayout>
  </div>
</template>
