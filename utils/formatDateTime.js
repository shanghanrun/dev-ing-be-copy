function formatDateTime(date) {
    try {
        if(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
        
            const formattedDate = `${year}.${month}.${day}`;
            const formattedTime = `${hours}:${minutes}:${seconds}`;
        
            return { date: formattedDate, time: formattedTime };
        } else {
            throw new Error('date가 존재하지 않습니다: ', date)
        }
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = formatDateTime