const isoTimeFormat = (dateTime) => {
    const date = new Date(dateTime);
    const LocalTime = date.toLocaleDateString('en-Us', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
    return LocalTime;
}

export default isoTimeFormat