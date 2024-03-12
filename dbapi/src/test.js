//function to wait for a few seconds
function wait(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function test() {
    console.log('Waiting 100000 seconds...');
    await wait(100000);
    console.log('Done waiting!');
}

test();
