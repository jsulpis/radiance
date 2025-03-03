export function benchmark<T>(fn: () => T) {
  performance.mark("start");
  const result = fn();
  performance.mark("end");
  const duration = Math.floor(performance.measure("duration", "start", "end").duration);

  return { result, duration };
}

export function checkResults(gpuResult: Float32Array, cpuResult: number[]) {
  for (let i = 0; i < gpuResult.length; i++) {
    if (gpuResult[i] !== cpuResult[i]) {
      console.error("CPU and GPU results do not match");
      return;
    }
  }
  console.log("CPU and GPU results match");
}

export function print(selector: string, content: string) {
  document.querySelector(selector)!.textContent = content;
}
