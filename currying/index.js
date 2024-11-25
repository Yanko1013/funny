// sum(1,2,3,4) -> sum(1)(2)(3)(4)

function sum(x) {
  function innerSum(y) {
    return sum(x+y)
  }
  
  innerSum.value = function () {
    return x
  }

  return innerSum
}

console.log(sum(1)(2)(3)(4).value())