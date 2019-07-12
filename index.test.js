const { spawnChrome } = require("chrome-debugging-client");
const { expect } = require('chai');

async function run(url, callback) {
  const chrome = spawnChrome({});
  try {
    const browser = chrome.connection;

    browser.on("error", err => {
      // underlying connection error or error dispatching events.
      console.error(`connection error ${err.stack}`);
    });

    const { targetId } = await browser.send("Target.createTarget", {
      url,
    });

    await browser.send("Target.activateTarget", { targetId });
    const page = await browser.attachToTarget(targetId);

    await callback(page);

    await browser.send("Target.closeTarget", { targetId });
    // graceful browser shutdown
    await chrome.close();
  } finally {
    await chrome.dispose();
  }
}

it('our first test', async function() {
  this.timeout(10000);
  await run(`file://${ __dirname }/index.html`, async page => {
    await page.send('Accessibility.enable');
    let data = await page.send('Accessibility.getFullAXTree');
    expect(data.nodes.length).to.equal(4);
    // <h1>Melanie, Melanie</h1>
    //
    // WebArea (internal)
    //   -> GenericContainer (internal)
    //      -> heading (Hello, Melanie);
    //        -> text (Hello, Melanie);
  });
});
