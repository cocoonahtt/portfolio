// One complete revolution, eased at both ends. Axis mapping is in metal-shelf.js.
window.CoraLetterMotion=(phase,motion)=>{const progress=phase-Math.sin(phase*Math.PI*2)*.35/(Math.PI*2);return (phase===1?0:progress*Math.PI*2)*(motion==='spin'?-1:1)};
