export function square(flatMatrix: number[], matrixSize: number) {
  const result = new Array(matrixSize * matrixSize).fill(0);

  for (let i = 0; i < matrixSize; i++) {
    for (let j = 0; j < matrixSize; j++) {
      for (let k = 0; k < matrixSize; k++) {
        result[i * matrixSize + j] +=
          flatMatrix[i * matrixSize + k] * flatMatrix[k * matrixSize + j];
      }
    }
  }

  return result;
}
