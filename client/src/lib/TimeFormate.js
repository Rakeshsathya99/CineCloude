const timeFormate = (minutes) =>{
    const hours = Math.floor(minutes / 60);
    const minutesReminder = minutes % 60;
    return `${hours}h ${minutesReminder}`
}

export default timeFormate