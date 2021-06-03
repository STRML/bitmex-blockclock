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
      columns: 'lastPrice,tickSize'
    }
  });
  const datum = response.data?.[0] || {lastPrice: 0, tickSize: 1};
  let {lastPrice, tickSize} = datum;
  if (tickSize >= 0.1) lastPrice = Math.round(lastPrice);
  else if (tickSize >= 0.01) lastPrice = lastPrice.toFixed(1);
  else if (lastPrice < 10) lastPrice = lastPrice.toFixed(5);
  return lastPrice;
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
    // Ratelimit, or host gone
    if (e?.response?.status === 429) {
      await delay(10 * 1000);
      return writePrice(price, symbol, volume);
    }
    if (!e?.response) {
      console.log(`Host ${CLOCK} gone, waiting a while then trying again...`);
      await delay(60 * 1000);
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