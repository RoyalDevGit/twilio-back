export const getImageSizes = (
  width: number,
  decreaseBy = 0.5,
  minWidth = 16
) => {
  const widths = [width]
  let currentWidth = Math.floor(width - width * decreaseBy)
  while (currentWidth > minWidth) {
    widths.push(currentWidth)
    currentWidth = Math.floor(currentWidth - currentWidth * decreaseBy)
  }

  return widths
}
