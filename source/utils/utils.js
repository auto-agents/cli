export function callAsync(func) {
    (async () => {
        await func()
    })();
}

export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export default { callAsync, wait }