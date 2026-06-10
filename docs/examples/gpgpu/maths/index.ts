import { square as gpuSquare } from "./gpu";
import { square as cpuSquare } from "./cpu";
import { print, benchmark, checkResults } from "./utils";
import "./styles.css";

const matrixSize = 500;
const matrixData = Array.from({ length: matrixSize * matrixSize }, () =>
  Math.floor(Math.random() * 10),
);

print("#size", `${matrixSize}`);

setTimeout(() => {
  const gpuResult = benchmark(() => gpuSquare(matrixData, matrixSize));
  print("#gpu", `${gpuResult.duration}ms`);

  // Let the UI update before running the (slow) CPU benchmark.
  setTimeout(() => {
    const cpuResult = benchmark(() => cpuSquare(matrixData, matrixSize));

    print(
      "#cpu",
      `${cpuResult.duration}ms (x${(cpuResult.duration / gpuResult.duration).toFixed(1)})`,
    );

    // commented out because too many iterations for Codesandbox
    // checkResults(gpuResult.result, cpuResult.result);
  }, 10);
}, 0);
