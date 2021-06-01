const axios = require('axios');

if (process.argv.length < 4) {
  console.error('USAGE: node app.js <ip> <symbol>');
  process.exit(1);
}

const [, , CLOCK, MARKET] = process.argv;

async function getBitMEXPrice(symbol) {
  const response = await axios.get('https://www.bitmex.com/api/v1/instrument', {
    params: {
      symbol,
      columns: 'lastPrice'
    }
  });
  const price = response.data?.[0]?.lastPrice || 0;
  return price;
}

async function getExchangeVolume() {
  const response = await axios.get('https://www.bitmex.com/api/v1/stats/historyUSD');
  const total = response.data.find((d) => d.rootSymbol === 'Total');
  return `$${(total.turnover24h / 1e9).toFixed(3)}B`;
}

async function writePrice(price, symbol, volume) {
  console.log('writing', price);
  try {
    await axios.get(`http://${CLOCK}/api/show/number/${price}`, {
      params: {
        pair: `${symbol.slice(0, 3)}/${symbol.slice(3)}`,
        sym: '$',
        tl: 'BitMEX',
        br: `Total Exchange Volume: ${volume}`,
      }
    })
  } catch (e) {
    if (e.response.status === 429) {
      await delay(10 * 1000);
      return writePrice(price, symbol, volume);
    }
    throw e;
  }
}

async function run() {
  const price = await getBitMEXPrice(MARKET);
  const volume = await getExchangeVolume();
  await writePrice(price, MARKET, volume);
  setTimeout(run, 1000 * 60 * 5);
}

run().catch(console.error);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

process.on('SIGINT', () => {
  console.log('SIGINT caught, exiting.');
  process.exit(0);
})