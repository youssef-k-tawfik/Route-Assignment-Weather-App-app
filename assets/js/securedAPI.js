// Access the secret from the environment variable
const secretVar = process.env.SECRETVAR;

if (secretVar) {
  console.log("Secret is available");
  console.log(secretVar);
} else {
  console.error("Secret is not set");
  process.exit(1); // Exit with an error code
}
