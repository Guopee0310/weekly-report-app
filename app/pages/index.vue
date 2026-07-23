<script setup lang="ts">
import type { ReportData, ReportPage } from '~/types/weeklyReport'

const { generateAndDownload } = useReportPdfGenerator()

const today = dateOnly(new Date())
const [weekStart, weekEnd] = weekRange(new Date())
const weekRangeLabel = `${fmtYMD(weekStart, '/')} ~ ${fmtYMD(weekEnd, '/')}`

const peopleNames = Object.keys(PEOPLE)
const selectedName = ref(peopleNames[0]!)
const suggestion = ref('')
const feeling = ref('')
const uploadedText = ref<string | null>(null)
const uploadedFileName = ref<string | null>(null)
const isDragOver = ref(false)
const isGenerating = ref(false)
const statusMessage = ref('')
const statusKind = ref<'ok' | 'error' | ''>('')

const currentPage = ref<ReportPage | null>(null)
const fileInputEl = ref<HTMLInputElement | null>(null)

const canGenerate = computed(() => uploadedText.value !== null && !isGenerating.value)

const previewData = computed<ReportData>(() => ({
  division: FIXED_DIVISION,
  dateRangeText: `${fmtYMD(weekStart, '/')}-${fmtYMD(weekEnd, '/')}`,
  targetName: selectedName.value,
  title: PEOPLE[selectedName.value]!.title,
  suggestion: suggestion.value,
  feeling: feeling.value,
  weekLines: [],
}))

function openFilePicker(): void {
  fileInputEl.value?.click()
}

function readFile(file: File): void {
  const reader = new FileReader()
  reader.onload = () => {
    uploadedText.value = reader.result as string
    uploadedFileName.value = file.name
    statusMessage.value = ''
    statusKind.value = ''
  }
  reader.onerror = () => {
    statusMessage.value = '讀取檔案失敗,請再試一次。'
    statusKind.value = 'error'
  }
  reader.readAsText(file, 'utf-8')
}

function handleFileInput(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) readFile(file)
}

function handleDrop(event: DragEvent): void {
  isDragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) readFile(file)
}

function buildReportData(): ReportData | null {
  if (!uploadedText.value) {
    statusMessage.value = '請先上傳 txt 檔案。'
    statusKind.value = 'error'
    return null
  }

  const targetName = selectedName.value
  const info = PEOPLE[targetName]!
  const messages = parseMessages(uploadedText.value)
  const { filtered, allDates } = filterForPerson(messages, targetName, weekStart, weekEnd, today)

  if (allDates.length && Math.min(...allDates.map((d) => d.getTime())) > weekStart.getTime()) {
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
    statusMessage.value = `警告:匯出的檔案最早只回溯到 ${fmtMD(minDate)},沒有涵蓋到起始日 ${fmtMD(weekStart)},結果可能不完整。`
    statusKind.value = 'error'
  } else {
    statusMessage.value = ''
    statusKind.value = ''
  }

  const stripped = stripSelfTag(filtered, targetName)
  const weekLines = buildWeekLines(stripped)

  return {
    division: FIXED_DIVISION,
    dateRangeText: `${fmtYMD(weekStart, '/')}-${fmtYMD(weekEnd, '/')}`,
    targetName,
    title: info.title,
    suggestion: suggestion.value.trim(),
    feeling: feeling.value.trim(),
    weekLines,
  }
}

async function handleGenerate(): Promise<void> {
  const data = buildReportData()
  if (!data) return

  isGenerating.value = true

  try {
    const info = PEOPLE[selectedName.value]!
    const outStub = `${fmtYMD(weekStart, '')}-${fmtYMD(weekEnd, '')}_${info.filenameLabel}_${selectedName.value}_週報`
    await generateAndDownload(data, outStub, currentPage)
    statusMessage.value = 'PDF 已下載到「下載」資料夾。'
    statusKind.value = 'ok'
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    statusMessage.value = `產生 PDF 時發生錯誤:${message}`
    statusKind.value = 'error'
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="report-bg min-h-screen px-5 py-12">
    <div class="mx-auto max-w-[620px]">
      <div class="glass rounded-[26px] border border-white/10 p-8">
        <h1 class="mb-1 text-2xl font-bold text-[#f2f3f7]">歐米茄恭喜又度過一週</h1>
        <p class="mb-6 text-sm text-white/55">{{ weekRangeLabel }}</p>

        <div class="mb-5">
          <label class="mb-2 block text-xs font-bold text-white/55">上傳 LINE 匯出的 txt 檔案</label>
          <div
            class="dropzone rounded-2xl border-[1.5px] border-dashed border-white/20 bg-white/5 px-5 py-6 text-center backdrop-blur-md transition"
            :class="{ 'dropzone--active': isDragOver }"
            @click="openFilePicker"
            @dragenter.prevent="isDragOver = true"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="handleDrop"
          >
            <input ref="fileInputEl" type="file" accept=".txt" class="hidden" @change="handleFileInput" />
            <p class="text-sm text-white/60">
              <template v-if="uploadedFileName">
                已選擇:<span class="font-bold text-white">{{ uploadedFileName }}</span>
              </template>
              <template v-else> 點這裡選檔案,或把 txt 拖曳進來 </template>
            </p>
          </div>
        </div>

        <div class="mb-5">
          <label class="mb-2 block text-xs font-bold text-white/55">我是</label>
          <select
            v-model="selectedName"
            class="glow-field w-full rounded-2xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-[15px] text-[#f2f3f7] backdrop-blur-md focus:outline-none"
          >
            <option v-for="name in peopleNames" :key="name" :value="name" class="text-[#1a1030]">
              {{ name }}
            </option>
          </select>
        </div>

        <div class="mb-5">
          <label class="mb-2 block text-xs font-bold text-white/55">建議改善事項</label>
          <textarea
            v-model="suggestion"
            rows="3"
            class="glow-field w-full rounded-2xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-[15px] text-[#f2f3f7] backdrop-blur-md focus:outline-none"
          />
        </div>

        <div class="mb-5">
          <label class="mb-2 block text-xs font-bold text-white/55">工作心得分享</label>
          <textarea
            v-model="feeling"
            rows="3"
            class="glow-field w-full rounded-2xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-[15px] text-[#f2f3f7] backdrop-blur-md focus:outline-none"
          />
        </div>

        <div class="mt-7 flex justify-end gap-2.5">
          <button
            type="button"
            :disabled="!canGenerate"
            class="generate-btn rounded-full bg-gradient-to-b from-white to-slate-100 px-7 py-3 text-[15px] font-bold text-[#14151b] transition disabled:cursor-not-allowed disabled:from-white/10 disabled:to-white/10 disabled:text-white/35"
            @click="handleGenerate"
          >
            產生 PDF
          </button>
        </div>
        <p
          class="mt-3.5 min-h-[18px] text-[13px]"
          :class="{
            'text-[#ff9d9d] font-bold': statusKind === 'error',
            'text-[#9dffce]': statusKind === 'ok',
            'text-white/70': statusKind === '',
          }"
        >
          {{ statusMessage }}
        </p>
      </div>
    </div>

    <ReportPrintablePage v-if="currentPage" :page="currentPage" :data="previewData" />
  </div>
</template>

<style scoped>
.report-bg {
  background:
    radial-gradient(circle at 18% 15%, rgba(70, 90, 150, 0.3), transparent 45%),
    radial-gradient(circle at 82% 20%, rgba(90, 70, 140, 0.26), transparent 45%),
    radial-gradient(circle at 25% 88%, rgba(50, 110, 140, 0.22), transparent 50%),
    radial-gradient(circle at 85% 82%, rgba(80, 60, 120, 0.24), transparent 50%),
    linear-gradient(160deg, #0a0b10 0%, #101219 55%, #0b0d13 100%);
  background-attachment: fixed;
}
.glass {
  background: rgba(255, 255, 255, 0.055);
  backdrop-filter: blur(30px) saturate(160%);
  -webkit-backdrop-filter: blur(30px) saturate(160%);
  box-shadow:
    0 24px 70px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.dropzone {
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    box-shadow 0.2s;
}
.dropzone:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 0 0 3px rgba(120, 150, 255, 0.12),
    0 0 30px rgba(120, 150, 255, 0.12);
}
.dropzone--active {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.12);
  box-shadow:
    0 0 0 3px rgba(120, 150, 255, 0.22),
    0 0 36px rgba(120, 150, 255, 0.2);
}
.glow-field {
  transition:
    background 0.15s,
    border-color 0.15s,
    box-shadow 0.2s;
}
.glow-field:hover {
  border-color: rgba(255, 255, 255, 0.28);
  box-shadow:
    0 0 0 3px rgba(120, 150, 255, 0.12),
    0 0 24px rgba(120, 150, 255, 0.1);
}
.glow-field:focus {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 0 0 3px rgba(120, 150, 255, 0.18),
    0 0 28px rgba(120, 150, 255, 0.16);
}
.generate-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow:
    0 12px 30px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(255, 255, 255, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}
</style>
