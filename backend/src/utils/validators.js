export default {
 isEmail(str) {
 return /\S+@\S+\.\S+/.test(str);
 }
};