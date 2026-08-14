export function incrementRenderCount() {
  const renderCountElement = document.querySelector("#renderCount")!;
  renderCountElement.firstChild!.nodeValue = `${Number(renderCountElement.textContent) + 1}`;
}
