function lazyInit(){
  let value;
  return function(){
    if(value== undefined){
      console.log('计算复杂的值');
      value=complexCalc()
    }
  }
}

//复杂的耗时计算
function complexCalc(){
  let sum = 0;
  for(let i=0;i<1000;i++){
    sum+=i
  }
  return sum;
}

const getValue = lazyInit()
console.log(getValue());
console.log(getValue());
console.log(getValue());
