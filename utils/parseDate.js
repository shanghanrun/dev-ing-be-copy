function parseDate(dateString) {
    if (dateString instanceof Date) {
        return dateString;
    } else {
        date = new Date(dateString);
        return date;
    }
}

module.exports = parseDate;
