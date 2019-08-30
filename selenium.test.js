const { Builder } = require('selenium-webdriver');
const { expect } = require('chai');
const { Command } = require('selenium-webdriver/lib/command');
const chrome = require('selenium-webdriver/chrome');

async function run(url, callback) {

  try {

    const driver = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(new chrome.Options().headless())
      .build()

    // add missing command to not only send command to the devtools protocol, 
    // but also get the result
    const executor = driver.getExecutor();
    executor.defineCommand(
      'sendDevToolsCommandAndGetResult',
      'POST',
      '/session/:sessionId/goog/cdp/execute');	

    // map this new command to a `send` asyn function
    driver.send = async function(cmd, params = {}) {
      return this.execute(
        new Command('sendDevToolsCommandAndGetResult')
        .setParameter('cmd', cmd)
        .setParameter('params', params));
    };

    await driver.get(url);

    await callback(driver);

  } catch (err) {
		console.log(err.message);
	}
}

it('our first test (selenimu)', async function() {
  this.timeout(10000);

  await run(`file://${ __dirname }/index.html`, async driver => {
    await driver.send('Accessibility.enable');

    const data = await driver.send('Accessibility.getFullAXTree');
    expect(data.nodes.length).to.equal(16);
  });
});
