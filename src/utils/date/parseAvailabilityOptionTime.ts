export const parseAvailabilityOptionTime = (time: string) => {
  const timeSplit = time.split(':')
  return {
    hours: +timeSplit[0],
    minutes: +timeSplit[1],
  }
}
