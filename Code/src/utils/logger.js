export default function logger(message) {
 console.log(`[LOG] ${new Date().toISOString()} - ${message}`);
}