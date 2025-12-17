import { hashSync } from "bcrypt";

const password = "FinanzOS2025!Secure#";
const hash = hashSync(password, 10);

console.log("Password:", password);
console.log("Hash:    ", hash);



