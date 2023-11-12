const convertSecondsToDuration = (totalSecs) => {
    const hours = Math.floor(totalSecs / 3600)
    const minutes = Math.floor((totalSecs % 3600) / 60)
    const seconds = Math.floor((totalSecs % 3600) % 60)
    if(hours > 0) {
        return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`
    } else {
        return `${seconds}s`
    }
}

module.exports = { convertSecondsToDuration, }