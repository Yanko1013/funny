import { ref, computed, reactive } from './theory.js'

const elements = {
  A0: document.querySelector('#a0'),
  A1: document.querySelector('#a1'),
  A2: document.querySelector('#a2'),
  NAME: document.querySelector('#name'),
  AGE: document.querySelector('#age'),
  PERSON: document.querySelector('#person')
}

const A0 = ref(1)
const A1 = ref(1)
const A2 = computed(() => parseInt(A0.value) + parseInt(A1.value))

const person = reactive({
  name: 'Yanko',
  age: 18
})

function updatePerson() {
  elements.PERSON.innerHTML = JSON.stringify(person)
}

function updateA2() {
  elements.A2.innerHTML = A2.value
}

function bindInputToRef(element, ref, callback) {
  element.addEventListener('input', (event) => {
    ref.value = event.target.value
    if (callback) callback()
  })
}

function bindInputToReactive(element, reactiveObject, key, callback) {
  element.addEventListener('input', (event) => {
    reactiveObject[key] = event.target.value
    if (callback) callback()
  })
}

bindInputToRef(elements.A0, A0, updateA2)

bindInputToRef(elements.A1, A1, updateA2)

bindInputToReactive(elements.NAME, person, 'name', updatePerson)
bindInputToReactive(elements.AGE, person, 'age', updatePerson)

// 初始化
updatePerson()