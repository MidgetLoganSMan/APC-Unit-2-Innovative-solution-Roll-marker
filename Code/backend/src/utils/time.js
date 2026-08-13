const timeUtils = {
 getCurrentPeriod() {
 const hour = new Date().getHours();
 if (hour >= 9 && hour < 10) return 1;
 if (hour >= 10 && hour < 11) return 2;
 if (hour >= 11 && hour < 12) return 3;
 return 0;
 }
};

export default timeUtils;