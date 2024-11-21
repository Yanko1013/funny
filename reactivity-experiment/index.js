import { ref, computed } from './theory.js'

const elementA0 = document.querySelector('#a0')
const elementA1 = document.querySelector('#a1')
const elementA2 = document.querySelector('#a2')

const A0 = ref(1)
const A1 = ref(1)
const A2 = computed(() => A0.value + A1.value)

elementA0.addEventListener('input', (event) => {
  A0.value = parseInt(event.target.value);
  elementA2.innerHTML = A2.value
});

elementA1.addEventListener('input', (event) => {
  A1.value = parseInt(event.target.value);
  elementA2.innerHTML = A2.value
});
