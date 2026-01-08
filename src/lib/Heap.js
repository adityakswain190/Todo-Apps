// src/lib/Heap.js

export default class MaxHeap {
  constructor() {
    this.heap = []
  }

  peek() {
    return this.heap.length ? this.heap[0] : null
  }

  insert(task) {
    this.heap.push(task)
    this._bubbleUp()
  }

  extractMax() {
    if (this.heap.length === 0) return null
    if (this.heap.length === 1) return this.heap.pop()

    const max = this.heap[0]
    this.heap[0] = this.heap.pop()
    this._bubbleDown()
    return max
  }

  _bubbleUp() {
    let idx = this.heap.length - 1

    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2)

      if (this.heap[parent].priority >= this.heap[idx].priority) break

      ;[this.heap[parent], this.heap[idx]] =
        [this.heap[idx], this.heap[parent]]

      idx = parent
    }
  }

  _bubbleDown() {
    let idx = 0
    const length = this.heap.length

    while (true) {
      let left = 2 * idx + 1
      let right = 2 * idx + 2
      let largest = idx

      if (
        left < length &&
        this.heap[left].priority > this.heap[largest].priority
      ) {
        largest = left
      }

      if (
        right < length &&
        this.heap[right].priority > this.heap[largest].priority
      ) {
        largest = right
      }

      if (largest === idx) break

      ;[this.heap[idx], this.heap[largest]] =
        [this.heap[largest], this.heap[idx]]

      idx = largest
    }
  }
}
