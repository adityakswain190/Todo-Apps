<script>
  import { onMount, tick } from 'svelte'
  import gsap from 'gsap'
  import MaxHeap from '$lib/Heap.js'

  let title = ''
  let priority = 5

  const heap = new MaxHeap()
  let todos = []

  // stats
  let completedStats = {}
  let view = 'weekly'

  // localStorage keys
  const STORAGE_KEY = 'todo-priority-queue'
  const STATS_KEY = 'todo-completed-stats'

  /* ---------------------------
     PERSISTENCE HELPERS
  ---------------------------- */
  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(heap.heap))
    localStorage.setItem(STATS_KEY, JSON.stringify(completedStats))
  }

  function loadState() {
    const storedTodos = localStorage.getItem(STORAGE_KEY)
    const storedStats = localStorage.getItem(STATS_KEY)

    if (storedTodos) {
      const parsed = JSON.parse(storedTodos)
      parsed.forEach(task => heap.insert(task))
      todos = heap.heap.slice()
    }

    if (storedStats) {
      completedStats = JSON.parse(storedStats)
    }
  }

  /* ---------------------------
     INITIAL LOAD
  ---------------------------- */
  onMount(async () => {
    loadState()
    await tick()
    animateTasks()
    animateStats()
  })

  /* ---------------------------
     ADD TASK
  ---------------------------- */
  async function addTodo() {
    if (!title.trim()) return

    heap.insert({
      id: crypto.randomUUID(),
      title,
      priority
    })

    todos = heap.heap.slice()
    title = ''
    priority = 5

    saveState()
    await tick()
    animateTasks()
  }

  /* ---------------------------
     COMPLETE TOP PRIORITY
  ---------------------------- */
  async function removeTop() {
    if (!todos.length) return

    const topEl = document.querySelector('.task-card')
    if (topEl) {
      await gsap.to(topEl, {
        y: -20,
        scale: 0.9,
        opacity: 0,
        duration: 0.25,
        ease: 'power1.in'
      })
    }

    heap.extractMax()
    todos = heap.heap.slice()

    const today = new Date().toISOString().split('T')[0]
    completedStats[today] = (completedStats[today] || 0) + 1
    completedStats = { ...completedStats }

    saveState()
    fireConfetti()

    await tick()
    animateTasks()
    animateStats()
  }

  /* ---------------------------
     TASK ANIMATIONS
  ---------------------------- */
  function animateTasks() {
    gsap.from('.task-card', {
      y: 20,
      opacity: 0,
      duration: 0.4,
      stagger: 0.05,
      ease: 'power2.out'
    })

    document.querySelectorAll('.task-card').forEach(card => {
      const p = +card.dataset.priority

      let color = '#4ade80'
      let glow = '0 0 0px'

      if (p >= 8) {
        color = '#ef4444'
        glow = '0 0 14px rgba(239,68,68,0.6)'
      } else if (p >= 5) {
        color = '#facc15'
        glow = '0 0 12px rgba(250,204,21,0.5)'
      }

      gsap.to(card, { boxShadow: glow, duration: 0.3 })
      gsap.to(card, { borderLeftColor: color, duration: 0.3 })
      gsap.to(card.querySelector('.priority-badge'), {
        backgroundColor: color,
        duration: 0.3
      })
    })
  }

  /* ---------------------------
     STATS ANIMATION
  ---------------------------- */
  function animateStats() {
    const bars = document.querySelectorAll('.stat-bar')
    if (!bars.length) return

    const tl = gsap.timeline()
    bars.forEach(bar => {
      const count = +bar.dataset.count
      const height = count * 20

      tl.to(bar, {
        attr: { height, y: 120 - height },
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.25')
    })
  }

  /* ---------------------------
     CONFETTI
  ---------------------------- */
  function fireConfetti() {
    const container = document.getElementById('confetti-layer')
    if (!container) return

    for (let i = 0; i < 20; i++) {
      const piece = document.createElement('div')
      container.appendChild(piece)

      gsap.set(piece, {
        position: 'absolute',
        width: 6,
        height: 6,
        backgroundColor: ['#ef4444', '#facc15', '#4ade80', '#6366f1'][i % 4],
        top: '50%',
        left: '50%',
        borderRadius: '50%'
      })

      gsap.to(piece, {
        x: gsap.utils.random(-200, 200),
        y: gsap.utils.random(-200, 200),
        opacity: 0,
        scale: gsap.utils.random(0.5, 1.2),
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => piece.remove()
      })
    }
  }

  /* ---------------------------
     DERIVED STATS
  ---------------------------- */
  $: statsArray = Object.entries(completedStats)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  $: filteredStats = statsArray.slice(view === 'weekly' ? -7 : -30)
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
  <div id="confetti-layer" class="fixed inset-0 pointer-events-none z-50"></div>

  <main class="max-w-6xl mx-auto px-6 py-12 space-y-12 text-slate-100">

    <!-- HEADER -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="col-span-2 rounded-2xl p-8 bg-white/5 backdrop-blur border border-white/10">
        <h1 class="text-3xl font-bold mb-2">Priority Task Dashboard</h1>
        <p class="text-slate-300">
          Persistent heap-based task manager with GSAP animations
        </p>
      </div>

      <div class="rounded-2xl p-6 bg-white/5 backdrop-blur border border-white/10 text-center">
        <p class="text-sm text-slate-400">Completed Tasks</p>
        <p class="text-4xl font-bold mt-2">
          {Object.values(completedStats).reduce((a, b) => a + b, 0)}
        </p>
      </div>
    </section>

    <!-- MAIN -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-8">

      <!-- ADD TASK -->
      <div class="bg-white rounded-2xl p-6 text-black shadow">
        <h2 class="text-lg font-semibold mb-4">Add Task</h2>

        <input
          class="w-full border rounded-lg p-3 mb-4"
          placeholder="Task name"
          bind:value={title}
        />

        <label class="text-sm font-medium">
          Priority: <strong>{priority}</strong>
        </label>

        <input
          type="range"
          min="1"
          max="10"
          bind:value={priority}
          class="w-full my-3"
        />

        <button
          on:click={addTodo}
          class="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
        >
          Add Task
        </button>
      </div>

      <!-- TASK LIST -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">Task Queue</h2>

        {#each todos as todo (todo.id)}
          <div
            class="task-card flex justify-between items-center p-4 rounded-xl bg-white text-black shadow"
            data-priority={todo.priority}
            style="border-left: 6px solid transparent"
          >
            <span class="font-medium">{todo.title}</span>
            <span class="priority-badge px-3 py-1 rounded-full text-sm font-bold">
              {todo.priority}
            </span>
          </div>
        {/each}

        {#if todos.length}
          <button
            on:click={removeTop}
            class="mt-4 w-full bg-red-500/20 text-red-300 py-2 rounded-lg hover:bg-red-500/30 transition"
          >
            Complete Highest Priority Task
          </button>
        {/if}
      </div>
    </section>

    <!-- ANALYTICS -->
    <section class="rounded-2xl p-6 bg-white/5 backdrop-blur border border-white/10 space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold">Completion Analytics</h2>

        <div class="flex gap-2">
          <button
            on:click={() => (view = 'weekly')}
            class="px-3 py-1 rounded-full text-sm
              {view === 'weekly' ? 'bg-indigo-600' : 'bg-white/10'}"
          >
            Weekly
          </button>
          <button
            on:click={() => (view = 'monthly')}
            class="px-3 py-1 rounded-full text-sm
              {view === 'monthly' ? 'bg-indigo-600' : 'bg-white/10'}"
          >
            Monthly
          </button>
        </div>
      </div>

      {#if filteredStats.length}
        <svg viewBox="0 0 300 120" class="w-full h-32">
          {#each filteredStats as stat, i}
            <rect
              class="stat-bar"
              data-count={stat.count}
              x={i * 40 + 10}
              y="120"
              width="24"
              height="0"
              rx="4"
              fill="#6366f1"
            />
          {/each}
        </svg>
      {:else}
        <p class="text-slate-400 text-sm">No completed tasks yet.</p>
      {/if}
    </section>

  </main>
</div>
