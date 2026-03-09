function addMonths(date, months) {
  const baseDate = new Date(date);
  const targetMonth = baseDate.getMonth() + months;
  const result = new Date(baseDate.getFullYear(), targetMonth, baseDate.getDate());
  if (result.getDate() !== baseDate.getDate()) {
    result.setDate(0);
  }
  return result;
}

module.exports = { addMonths };
