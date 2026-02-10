export default function callAsync(func) {
    (async () => {
        await func()
    })();
}