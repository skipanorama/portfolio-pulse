import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { getYahooSymbol } from '../lib/utils';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Delete existing data
  await prisma.analystRating.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.portfolio.deleteMany();

  // ─── Portfolio 1: iTrade Tonyco Cash ────────────────────────────────────────
  const p1 = await prisma.portfolio.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'iTrade Tonyco Cash',
      owner: 'Tonyco',
      broker: 'Scotia iTrade',
      accountType: 'Cash',
      accountId: '54892384',
      currency: 'CAD',
    },
  });

  await prisma.holding.createMany({
    data: [
      { portfolioId: p1.id, symbol: 'ACO.X',  yahooSymbol: getYahooSymbol('ACO.X','CAD'),  name: 'ATCO LTD-CL I NON-VTG',                         quantity: 500,    currency: 'CAD', avgCost: 36.86,   bookValue: 18439.99,  marketPrice: 68.36,   marketValue: 34180.00,   unrealizedGain: 15740.01,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'ATRL',    yahooSymbol: getYahooSymbol('ATRL','CAD'),    name: 'ATKINSREALIS GROUP INC COM',                    quantity: 1000,   currency: 'CAD', avgCost: 38.67,   bookValue: 38669.98,  marketPrice: 88.90,   marketValue: 88900.00,   unrealizedGain: 50230.02,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'BABA',    yahooSymbol: getYahooSymbol('BABA','USD'),    name: 'ALIBABA GROUP HOLDING LTD SPONSORED ADR',       quantity: 100,    currency: 'USD', avgCost: 116.73,  bookValue: 14695.66,  marketPrice: 134.63,  marketValue: 18451.04,   unrealizedGain: 3755.38,    assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'BB',      yahooSymbol: getYahooSymbol('BB','CAD'),      name: 'BLACKBERRY LTD COM',                            quantity: 1500,   currency: 'CAD', avgCost: 13.85,   bookValue: 20775.00,  marketPrice: 8.51,    marketValue: 12765.00,   unrealizedGain: -8010.00,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'BCE',     yahooSymbol: getYahooSymbol('BCE','CAD'),     name: 'BCE INC COM NEW',                               quantity: 500,    currency: 'CAD', avgCost: 46.33,   bookValue: 23172.99,  marketPrice: 33.53,   marketValue: 16765.00,   unrealizedGain: -6407.99,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'CNQ',     yahooSymbol: getYahooSymbol('CNQ','CAD'),     name: 'CANADIAN NATURAL RESOURCES LTD',                quantity: 4000,   currency: 'CAD', avgCost: 14.42,   bookValue: 57661.38,  marketPrice: 64.27,   marketValue: 257080.00,  unrealizedGain: 199418.62,  assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'EMA',     yahooSymbol: getYahooSymbol('EMA','CAD'),     name: 'EMERA INC',                                     quantity: 500,    currency: 'CAD', avgCost: 47.75,   bookValue: 23883.99,  marketPrice: 71.65,   marketValue: 35825.00,   unrealizedGain: 11941.01,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'ENB',     yahooSymbol: getYahooSymbol('ENB','CAD'),     name: 'ENBRIDGE INC',                                  quantity: 500,    currency: 'CAD', avgCost: 46.20,   bookValue: 23099.99,  marketPrice: 75.19,   marketValue: 37595.00,   unrealizedGain: 14495.01,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'FTS',     yahooSymbol: getYahooSymbol('FTS','CAD'),     name: 'FORTIS INC',                                    quantity: 500,    currency: 'CAD', avgCost: 53.52,   bookValue: 26769.99,  marketPrice: 77.15,   marketValue: 38575.00,   unrealizedGain: 11805.01,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'GIB.A',   yahooSymbol: getYahooSymbol('GIB.A','CAD'),   name: 'CGI INC CL A SUB VTG',                          quantity: 500,    currency: 'CAD', avgCost: 27.02,   bookValue: 13512.00,  marketPrice: 86.70,   marketValue: 43350.00,   unrealizedGain: 29838.00,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'GLW',     yahooSymbol: getYahooSymbol('GLW','USD'),     name: 'CORNING INC',                                   quantity: 1000,   currency: 'USD', avgCost: 10.61,   bookValue: 13360.48,  marketPrice: 198.29,  marketValue: 271756.45,  unrealizedGain: 258395.97,  assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'HUT',     yahooSymbol: getYahooSymbol('HUT','CAD'),     name: 'HUT 8 CORP COMMON STOCK',                       quantity: 1000,   currency: 'CAD', avgCost: 10.51,   bookValue: 10519.99,  marketPrice: 146.89,  marketValue: 146890.00,  unrealizedGain: 136370.01,  assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'IBM',     yahooSymbol: getYahooSymbol('IBM','USD'),     name: 'INTERNATIONAL BUSINESS MACHINES CORP',          quantity: 200,    currency: 'USD', avgCost: 153.98,  bookValue: 38770.56,  marketPrice: 219.27,  marketValue: 60101.91,   unrealizedGain: 21331.35,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'K',       yahooSymbol: getYahooSymbol('K','CAD'),       name: 'KINROSS GOLD CORP',                             quantity: 5000,   currency: 'CAD', avgCost: 6.88,    bookValue: 34387.65,  marketPrice: 43.52,   marketValue: 217600.00,  unrealizedGain: 183212.35,  assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'KD',      yahooSymbol: getYahooSymbol('KD','USD'),      name: 'KYNDRYL HOLDINGS INC COMMON STOCK',             quantity: 40,     currency: 'USD', avgCost: 23.48,   bookValue: 1182.32,   marketPrice: 11.49,   marketValue: 629.61,     unrealizedGain: -552.71,    assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'KEY',     yahooSymbol: getYahooSymbol('KEY','CAD'),     name: 'KEYERA CORP',                                   quantity: 500,    currency: 'CAD', avgCost: 34.07,   bookValue: 17045.99,  marketPrice: 53.64,   marketValue: 26820.00,   unrealizedGain: 9774.01,    assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'MFC',     yahooSymbol: getYahooSymbol('MFC','CAD'),     name: 'MANULIFE FINANCIAL CORP',                       quantity: 3000,   currency: 'CAD', avgCost: 10.41,   bookValue: 31229.70,  marketPrice: 54.82,   marketValue: 164460.00,  unrealizedGain: 133230.30,  assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'NTR',     yahooSymbol: getYahooSymbol('NTR','CAD'),     name: 'NUTRIEN LTD COM',                               quantity: 400,    currency: 'CAD', avgCost: 69.92,   bookValue: 27968.00,  marketPrice: 98.64,   marketValue: 39456.00,   unrealizedGain: 11488.00,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'PSK',     yahooSymbol: getYahooSymbol('PSK','CAD'),     name: 'PRAIRIESKY ROYALTY LTD COM',                    quantity: 40,     currency: 'CAD', avgCost: 24.89,   bookValue: 995.60,    marketPrice: 34.16,   marketValue: 1366.40,    unrealizedGain: 370.80,     assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'SU',      yahooSymbol: getYahooSymbol('SU','CAD'),      name: 'SUNCOR ENERGY INC',                             quantity: 1500,   currency: 'CAD', avgCost: 30.41,   bookValue: 45609.08,  marketPrice: 91.15,   marketValue: 136725.00,  unrealizedGain: 91115.92,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'T',       yahooSymbol: getYahooSymbol('T','CAD'),       name: 'TELUS CORPORATION',                             quantity: 1000,   currency: 'CAD', avgCost: 21.76,   bookValue: 21755.49,  marketPrice: 17.22,   marketValue: 17220.00,   unrealizedGain: -4535.49,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'TD',      yahooSymbol: getYahooSymbol('TD','CAD'),      name: 'TORONTO-DOMINION BANK',                         quantity: 200,    currency: 'CAD', avgCost: 81.16,   bookValue: 16241.99,  marketPrice: 147.59,  marketValue: 29518.00,   unrealizedGain: 13276.01,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'XLY',     yahooSymbol: getYahooSymbol('XLY','CAD'),     name: 'AUXLY CANNABIS GROUP INC COM',                  quantity: 5000,   currency: 'CAD', avgCost: 1.08,    bookValue: 5389.99,   marketPrice: 0.14,    marketValue: 700.00,     unrealizedGain: -4689.99,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'JD',      yahooSymbol: getYahooSymbol('JD','USD'),      name: 'JD.COM INC SPONSORED ADR',                      quantity: 300,    currency: 'USD', avgCost: 36.36,   bookValue: 10907.49,  marketPrice: 31.49,   marketValue: 9447.00,    unrealizedGain: -1460.49,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'LOW',     yahooSymbol: getYahooSymbol('LOW','USD'),     name: 'LOWES COMPANIES INC',                           quantity: 200,    currency: 'USD', avgCost: 67.83,   bookValue: 13566.46,  marketPrice: 224.51,  marketValue: 44902.00,   unrealizedGain: 31335.54,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'SPLY',    yahooSymbol: getYahooSymbol('SPLY','USD'),    name: 'SOCIALPLAY USA INC COM',                        quantity: 2000,   currency: 'USD', avgCost: 2.43,    bookValue: 4854.99,   marketPrice: 0.00,    marketValue: 0.00,       unrealizedGain: -4854.99,   assetType: 'stock' },
      { portfolioId: p1.id, symbol: 'TCEHY',   yahooSymbol: getYahooSymbol('TCEHY','USD'),   name: 'TENCENT HOLDINGS LTD UNSPONSORED ADR',          quantity: 250,    currency: 'USD', avgCost: 49.28,   bookValue: 12319.99,  marketPrice: 58.30,   marketValue: 14575.00,   unrealizedGain: 2255.01,    assetType: 'stock' },
    ],
  });

  // ─── Portfolio 2: iTrade Anton Cash ─────────────────────────────────────────
  const p2 = await prisma.portfolio.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'iTrade Anton Cash',
      owner: 'Anton',
      broker: 'Scotia iTrade',
      accountType: 'Cash',
      accountId: '55394331',
      currency: 'CAD',
    },
  });

  await prisma.holding.createMany({
    data: [
      { portfolioId: p2.id, symbol: 'ARKK',     yahooSymbol: getYahooSymbol('ARKK','USD'),     name: 'ARK ETF TRUST ARK INNOVATION ETF',              quantity: 200,    currency: 'USD', avgCost: 45.28,   bookValue: 11853.78,  marketPrice: 78.25,   marketValue: 21448.33,   unrealizedGain: 9594.55,    assetType: 'etf' },
      { portfolioId: p2.id, symbol: 'BMO',       yahooSymbol: getYahooSymbol('BMO','CAD'),       name: 'BANK OF MONTREAL',                              quantity: 500,    currency: 'CAD', avgCost: 24.80,   bookValue: 12397.95,  marketPrice: 209.04,  marketValue: 104520.00,  unrealizedGain: 92122.05,   assetType: 'stock' },
      { portfolioId: p2.id, symbol: 'BNG',       yahooSymbol: getYahooSymbol('BNG','CAD'),       name: 'BENGAL ENERGY LTD',                             quantity: 7806,   currency: 'CAD', avgCost: 0.74,    bookValue: 5776.44,   marketPrice: 0.04,    marketValue: 312.24,     unrealizedGain: -5464.20,   assetType: 'stock' },
      { portfolioId: p2.id, symbol: 'CNQ',       yahooSymbol: getYahooSymbol('CNQ','CAD'),       name: 'CANADIAN NATURAL RESOURCES LTD',                quantity: 4000,   currency: 'CAD', avgCost: 10.83,   bookValue: 43317.30,  marketPrice: 64.27,   marketValue: 257080.00,  unrealizedGain: 213762.70,  assetType: 'stock' },
      { portfolioId: p2.id, symbol: 'D040830',   yahooSymbol: 'D040830',                        name: 'DRAGONWAVE INC COM NEW',                        quantity: 40,     currency: 'CAD', avgCost: 143.17,  bookValue: 5726.95,   marketPrice: 0.04,    marketValue: 1.65,       unrealizedGain: -5725.30,   assetType: 'stock' },
      { portfolioId: p2.id, symbol: 'HOOD',      yahooSymbol: getYahooSymbol('HOOD','USD'),      name: 'ROBINHOOD MARKETS INC CLASS A COMMON STOCK',    quantity: 250,    currency: 'USD', avgCost: 23.10,   bookValue: 7269.78,   marketPrice: 78.27,   marketValue: 26817.26,   unrealizedGain: 19547.48,   assetType: 'stock' },
      { portfolioId: p2.id, symbol: 'NSCI',      yahooSymbol: getYahooSymbol('NSCI','CAD'),      name: 'NANALYSIS SCIENTIFIC CORP COM',                 quantity: 362500, currency: 'CAD', avgCost: 1.10,    bookValue: 398750.00, marketPrice: 0.15,    marketValue: 54375.00,   unrealizedGain: -344375.00, assetType: 'stock' },
      { portfolioId: p2.id, symbol: 'PSK',       yahooSymbol: getYahooSymbol('PSK','CAD'),       name: 'PRAIRIESKY ROYALTY LTD COM',                    quantity: 40,     currency: 'CAD', avgCost: 24.89,   bookValue: 995.60,    marketPrice: 34.16,   marketValue: 1366.40,    unrealizedGain: 370.80,     assetType: 'stock' },
      { portfolioId: p2.id, symbol: 'SHOP',      yahooSymbol: getYahooSymbol('SHOP','CAD'),      name: 'SHOPIFY INC CL A',                              quantity: 800,    currency: 'CAD', avgCost: 63.78,   bookValue: 51026.58,  marketPrice: 136.87,  marketValue: 109496.00,  unrealizedGain: 58469.42,   assetType: 'stock' },
      { portfolioId: p2.id, symbol: 'SU',        yahooSymbol: getYahooSymbol('SU','CAD'),        name: 'SUNCOR ENERGY INC',                             quantity: 2000,   currency: 'CAD', avgCost: 26.57,   bookValue: 53140.00,  marketPrice: 91.15,   marketValue: 182300.00,  unrealizedGain: 129160.00,  assetType: 'stock' },
      { portfolioId: p2.id, symbol: 'TD',        yahooSymbol: getYahooSymbol('TD','CAD'),        name: 'TORONTO-DOMINION BANK',                         quantity: 750,    currency: 'CAD', avgCost: 78.43,   bookValue: 58832.49,  marketPrice: 147.59,  marketValue: 110692.50,  unrealizedGain: 51860.01,   assetType: 'stock' },
      { portfolioId: p2.id, symbol: 'XLY',       yahooSymbol: getYahooSymbol('XLY','CAD'),       name: 'AUXLY CANNABIS GROUP INC COM',                  quantity: 3000,   currency: 'CAD', avgCost: 1.32,    bookValue: 3970.99,   marketPrice: 0.14,    marketValue: 420.00,     unrealizedGain: -3550.99,   assetType: 'stock' },
      // USD side
      { portfolioId: p2.id, symbol: 'ARKK',     yahooSymbol: getYahooSymbol('ARKK','USD'),     name: 'ARK ETF TRUST ARK INNOVATION ETF',              quantity: 100,    currency: 'USD', avgCost: 37.59,   bookValue: 3768.90,   marketPrice: 78.25,   marketValue: 7825.00,    unrealizedGain: 4056.10,    assetType: 'etf' },
      { portfolioId: p2.id, symbol: 'AXP',       yahooSymbol: getYahooSymbol('AXP','USD'),       name: 'AMERICAN EXPRESS COMPANY',                      quantity: 500,    currency: 'USD', avgCost: 11.19,   bookValue: 5594.47,   marketPrice: 314.39,  marketValue: 157195.00,  unrealizedGain: 151600.53,  assetType: 'stock' },
      { portfolioId: p2.id, symbol: 'GE',        yahooSymbol: getYahooSymbol('GE','USD'),        name: 'GE AEROSPACE COMMON STOCK',                     quantity: 250,    currency: 'USD', avgCost: 64.19,   bookValue: 16047.70,  marketPrice: 297.65,  marketValue: 74412.50,   unrealizedGain: 58364.80,   assetType: 'stock' },
      { portfolioId: p2.id, symbol: 'GEHC',      yahooSymbol: getYahooSymbol('GEHC','USD'),      name: 'GE HEALTHCARE TECHNOLOGIES INC COMMON STOCK',   quantity: 83,     currency: 'USD', avgCost: 58.95,   bookValue: 4873.35,   marketPrice: 62.29,   marketValue: 5170.07,    unrealizedGain: 296.72,     assetType: 'stock' },
      { portfolioId: p2.id, symbol: 'GEV',       yahooSymbol: getYahooSymbol('GEV','USD'),       name: 'GE VERNOVA INC COMMON STOCK',                   quantity: 62,     currency: 'USD', avgCost: 126.06,  bookValue: 7750.76,   marketPrice: 1073.03, marketValue: 66527.86,   unrealizedGain: 58777.10,   assetType: 'stock' },
      { portfolioId: p2.id, symbol: 'SNDL',      yahooSymbol: getYahooSymbol('SNDL','USD'),      name: 'SNDL INC COM',                                  quantity: 13153,  currency: 'USD', avgCost: 7.21,    bookValue: 94787.15,  marketPrice: 1.41,    marketValue: 18545.73,   unrealizedGain: -76241.42,  assetType: 'stock' },
      { portfolioId: p2.id, symbol: 'WAB',       yahooSymbol: getYahooSymbol('WAB','USD'),       name: 'WABTEC CORP COMMON STOCK',                      quantity: 10,     currency: 'USD', avgCost: 73.26,   bookValue: 732.60,    marketPrice: 269.03,  marketValue: 2690.30,    unrealizedGain: 1957.70,    assetType: 'stock' },
    ],
  });

  // ─── Portfolio 3: EJ Anton TFSA ─────────────────────────────────────────────
  const p3 = await prisma.portfolio.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'EJ Anton TFSA',
      owner: 'Anton',
      broker: 'Edward Jones',
      accountType: 'TFSA',
      accountId: 'TFSA-1',
      currency: 'CAD',
    },
  });

  await prisma.holding.createMany({
    data: [
      { portfolioId: p3.id, symbol: 'ATRL',     yahooSymbol: getYahooSymbol('ATRL','CAD'),     name: 'ATKINSREALIS GROUP INC COM',                    quantity: 192,     currency: 'CAD', bookValue: 10944.56,  marketPrice: 89.94,  marketValue: 17268.48,  unrealizedGain: 6323.92,   assetType: 'stock' },
      { portfolioId: p3.id, symbol: 'BRK.B',    yahooSymbol: getYahooSymbol('BRK.B','USD'),    name: 'BERKSHIRE HATHAWAY INC DEL CL B',               quantity: 50,      currency: 'USD', bookValue: 10445.07,  marketPrice: 479.55, marketValue: 23977.50,  unrealizedGain: 13532.43,  assetType: 'stock' },
      { portfolioId: p3.id, symbol: 'CAE',      yahooSymbol: getYahooSymbol('CAE','CAD'),      name: 'CAE INC',                                       quantity: 300,     currency: 'CAD', bookValue: 11346.50,  marketPrice: 35.70,  marketValue: 10710.00,  unrealizedGain: -636.50,   assetType: 'stock' },
      { portfolioId: p3.id, symbol: 'CP',       yahooSymbol: getYahooSymbol('CP','CAD'),       name: 'CANADIAN PAC KANS CITY LTD COM',                quantity: 200,     currency: 'CAD', bookValue: 19974.00,  marketPrice: 115.80, marketValue: 23160.00,  unrealizedGain: 3186.00,   assetType: 'stock' },
      { portfolioId: p3.id, symbol: 'D.UN',     yahooSymbol: getYahooSymbol('D.UN','CAD'),     name: 'DREAM OFFICE REAL ESTATE INVT TR UNIT SER A NEW', quantity: 113,   currency: 'CAD', bookValue: 6692.02,   marketPrice: 17.28,  marketValue: 1952.64,   unrealizedGain: -4739.38,  assetType: 'reit' },
      { portfolioId: p3.id, symbol: 'FTT',      yahooSymbol: getYahooSymbol('FTT','CAD'),      name: 'FINNING INTERNATIONAL INC',                     quantity: 400,     currency: 'CAD', bookValue: 10211.64,  marketPrice: 97.17,  marketValue: 38868.00,  unrealizedGain: 28656.36,  assetType: 'stock' },
      { portfolioId: p3.id, symbol: 'MG',       yahooSymbol: getYahooSymbol('MG','CAD'),       name: 'MAGNA INTERNATIONAL INC COM',                   quantity: 160,     currency: 'CAD', bookValue: 7210.80,   marketPrice: 85.40,  marketValue: 13664.00,  unrealizedGain: 6453.20,   assetType: 'stock' },
      { portfolioId: p3.id, symbol: 'META',     yahooSymbol: getYahooSymbol('META','USD'),     name: 'META PLATFORMS INC CLASS A COMMON STOCK',       quantity: 15,      currency: 'USD', bookValue: 7881.14,   marketPrice: 598.86, marketValue: 8982.90,   unrealizedGain: 1101.76,   assetType: 'stock' },
      { portfolioId: p3.id, symbol: 'REI.UN',   yahooSymbol: getYahooSymbol('REI.UN','CAD'),   name: 'RIOCAN REAL ESTATE INVESTMENT TRUST UNITS',     quantity: 360,     currency: 'CAD', bookValue: 4966.74,   marketPrice: 21.72,  marketValue: 7819.20,   unrealizedGain: 2852.46,   assetType: 'reit' },
      { portfolioId: p3.id, symbol: 'NOW',      yahooSymbol: getYahooSymbol('NOW','USD'),      name: 'SERVICENOW INC COM',                            quantity: 70,      currency: 'USD', bookValue: 10779.71,  marketPrice: 91.49,  marketValue: 6404.30,   unrealizedGain: -4375.41,  assetType: 'stock' },
      { portfolioId: p3.id, symbol: 'SLF',      yahooSymbol: getYahooSymbol('SLF','CAD'),      name: 'SUN LIFE FINANCIAL INC',                        quantity: 270,     currency: 'CAD', bookValue: 5712.12,   marketPrice: 96.30,  marketValue: 26001.00,  unrealizedGain: 20288.88,  assetType: 'stock' },
      { portfolioId: p3.id, symbol: 'UBER',     yahooSymbol: getYahooSymbol('UBER','USD'),     name: 'UBER TECHNOLOGIES INC COMMON STOCK',            quantity: 200,     currency: 'USD', bookValue: 7650.56,   marketPrice: 76.15,  marketValue: 15230.00,  unrealizedGain: 7579.44,   assetType: 'stock' },
      { portfolioId: p3.id, symbol: 'AIM61203', yahooSymbol: 'AIM61203',                       name: 'INVESCO MONTHLY INCM ETF PORTFOLIO SR A',       quantity: 169.475, currency: 'CAD', bookValue: 1772.02,   marketPrice: 11.343, marketValue: 1922.35,   unrealizedGain: 150.33,    assetType: 'mutual_fund' },
    ],
  });

  // ─── Portfolio 4: EJ Anton RRSP ──────────────────────────────────────────────
  const p4 = await prisma.portfolio.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: 'EJ Anton RRSP',
      owner: 'Anton',
      broker: 'Edward Jones',
      accountType: 'RRSP',
      accountId: 'RRSP-1',
      currency: 'CAD',
    },
  });

  await prisma.holding.createMany({
    data: [
      { portfolioId: p4.id, symbol: 'ATD',      yahooSymbol: getYahooSymbol('ATD','CAD'),      name: 'ALIMENTATION COUCHE-TARD INC COM',              quantity: 384,     currency: 'CAD', bookValue: 114.05,    marketPrice: 78.00,   marketValue: 29952.00,  unrealizedGain: 29837.95,  assetType: 'stock' },
      { portfolioId: p4.id, symbol: 'FM',       yahooSymbol: getYahooSymbol('FM','CAD'),       name: 'FIRST QUANTUM MINERALS LTD',                    quantity: 235,     currency: 'CAD', bookValue: 4147.27,   marketPrice: 34.81,   marketValue: 8180.35,   unrealizedGain: 4033.08,   assetType: 'stock' },
      { portfolioId: p4.id, symbol: 'FTS',      yahooSymbol: getYahooSymbol('FTS','CAD'),      name: 'FORTIS INC',                                    quantity: 250,     currency: 'CAD', bookValue: 10991.25,  marketPrice: 76.89,   marketValue: 19222.50,  unrealizedGain: 8231.25,   assetType: 'stock' },
      { portfolioId: p4.id, symbol: 'SAY',      yahooSymbol: getYahooSymbol('SAY','CAD'),      name: 'SPARTA CAPITAL LTD',                            quantity: 4000,    currency: 'CAD', bookValue: 3248.00,   marketPrice: 0.00,    marketValue: 4.00,      unrealizedGain: -3244.00,  assetType: 'stock' },
      { portfolioId: p4.id, symbol: 'WSP',      yahooSymbol: getYahooSymbol('WSP','CAD'),      name: 'WSP GLOBAL INC COM',                            quantity: 100,     currency: 'CAD', bookValue: 6178.56,   marketPrice: 211.10,  marketValue: 21110.00,  unrealizedGain: 14931.44,  assetType: 'stock' },
      { portfolioId: p4.id, symbol: 'AGF799',   yahooSymbol: 'AGF799',                         name: 'AGF CDN DIV INCM FUND',                         quantity: 686.983, currency: 'CAD', bookValue: 11402.96,  marketPrice: 22.535,  marketValue: 15481.16,  unrealizedGain: 4078.20,   assetType: 'mutual_fund' },
      { portfolioId: p4.id, symbol: 'CIG2321',  yahooSymbol: 'CIG2321',                        name: 'CI CDN EQTY CORP CL A ISC',                     quantity: 1769.252,currency: 'CAD', bookValue: 28585.72,  marketPrice: 24.686,  marketValue: 43675.75,  unrealizedGain: 15090.03,  assetType: 'mutual_fund' },
      { portfolioId: p4.id, symbol: 'CIG2575',  yahooSymbol: 'CIG2575',                        name: 'CI INTL EQUITY CORP CL (SERIES A SHARES)',      quantity: 329.802, currency: 'CAD', bookValue: 5976.14,   marketPrice: 21.421,  marketValue: 7064.69,   unrealizedGain: 1088.55,   assetType: 'mutual_fund' },
      { portfolioId: p4.id, symbol: 'TML707',   yahooSymbol: 'TML707',                         name: 'FRANKLIN ROYCE GBL SMALL CAP PREMIER FD SR A',  quantity: 430.548, currency: 'CAD', bookValue: 8651.77,   marketPrice: 29.156,  marketValue: 12553.05,  unrealizedGain: 3901.28,   assetType: 'mutual_fund' },
      { portfolioId: p4.id, symbol: 'AIM6513',  yahooSymbol: 'AIM6513',                        name: 'INVESCO GBL COMPANIES FUND SR A',               quantity: 234.506, currency: 'CAD', bookValue: 9569.06,   marketPrice: 74.811,  marketValue: 17543.63,  unrealizedGain: 7974.57,   assetType: 'mutual_fund' },
      { portfolioId: p4.id, symbol: 'MFC2710',  yahooSymbol: 'MFC2710',                        name: 'MACKENZIE GLOBAL DIVIDEND FD SR A',             quantity: 193.969, currency: 'CAD', bookValue: 4977.36,   marketPrice: 39.528,  marketValue: 7667.21,   unrealizedGain: 2689.85,   assetType: 'mutual_fund' },
      { portfolioId: p4.id, symbol: 'ATL1161',  yahooSymbol: 'ATL1161',                        name: 'RENAISSANCE GLOBAL HEALTH CARE FUND',           quantity: 480.686, currency: 'CAD', bookValue: 13174.89,  marketPrice: 48.366,  marketValue: 23248.88,  unrealizedGain: 10073.99,  assetType: 'mutual_fund' },
    ],
  });

  // ─── Portfolio 5: EJ Tonyco Corp ─────────────────────────────────────────────
  const p5 = await prisma.portfolio.upsert({
    where: { id: 5 },
    update: {},
    create: {
      name: 'EJ Tonyco Corp',
      owner: 'Tonyco',
      broker: 'Edward Jones',
      accountType: 'Corporation',
      accountId: 'Corp-1',
      currency: 'CAD',
    },
  });

  await prisma.holding.createMany({
    data: [
      { portfolioId: p5.id, symbol: 'AMD',      yahooSymbol: getYahooSymbol('AMD','USD'),      name: 'ADVANCED MICRO DEVICES INC COM',                quantity: 40,      currency: 'USD', bookValue: 8230.80,   marketPrice: 458.79,  marketValue: 18351.60,  unrealizedGain: 10120.80,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'BABA',     yahooSymbol: getYahooSymbol('BABA','USD'),     name: 'ALIBABA GROUP HOLDING LTD SPONSORED ADR',       quantity: 60,      currency: 'USD', bookValue: 7805.28,   marketPrice: 137.30,  marketValue: 8238.00,   unrealizedGain: 432.72,    assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'GOOGL',    yahooSymbol: getYahooSymbol('GOOGL','USD'),    name: 'ALPHABET INC CLASS A COMMON STOCK',             quantity: 120,     currency: 'USD', bookValue: 10798.40,  marketPrice: 388.64,  marketValue: 46636.80,  unrealizedGain: 35838.40,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'ALA',      yahooSymbol: getYahooSymbol('ALA','CAD'),      name: 'ALTAGAS LTD',                                   quantity: 130,     currency: 'CAD', bookValue: 5293.92,   marketPrice: 51.35,   marketValue: 6675.50,   unrealizedGain: 1381.58,   assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'AVY',      yahooSymbol: getYahooSymbol('AVY','USD'),      name: 'AVERY DENNISON CORP',                           quantity: 130,     currency: 'USD', bookValue: 4080.70,   marketPrice: 162.02,  marketValue: 21062.60,  unrealizedGain: 16981.90,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'BMO',      yahooSymbol: getYahooSymbol('BMO','CAD'),      name: 'BANK OF MONTREAL',                              quantity: 200,     currency: 'CAD', bookValue: 6176.00,   marketPrice: 208.85,  marketValue: 41770.00,  unrealizedGain: 35594.00,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'ABX',      yahooSymbol: getYahooSymbol('ABX','CAD'),      name: 'BARRICK MNG CORP COM',                          quantity: 160,     currency: 'CAD', bookValue: 10395.64,  marketPrice: 64.00,   marketValue: 10240.00,  unrealizedGain: -155.64,   assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'BCE',      yahooSymbol: getYahooSymbol('BCE','CAD'),      name: 'BCE INC COM NEW',                               quantity: 274,     currency: 'CAD', bookValue: 6351.32,   marketPrice: 33.20,   marketValue: 9096.80,   unrealizedGain: 2745.48,   assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'BEPC',     yahooSymbol: getYahooSymbol('BEPC','CAD'),     name: 'BROOKFIELD RENEWABLE CORP NEW CL A EXCHANGEABLE', quantity: 37,   currency: 'CAD', bookValue: 1346.20,   marketPrice: 50.50,   marketValue: 1868.50,   unrealizedGain: 522.30,    assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'BEP.UN',   yahooSymbol: getYahooSymbol('BEP.UN','CAD'),   name: 'BROOKFIELD RENEWABLE PARTNERS L P',             quantity: 150,     currency: 'CAD', bookValue: 4337.38,   marketPrice: 46.95,   marketValue: 7042.50,   unrealizedGain: 2705.12,   assetType: 'reit' },
      { portfolioId: p5.id, symbol: 'CNR',      yahooSymbol: getYahooSymbol('CNR','CAD'),      name: 'CANADIAN NATIONAL RAILWAY CO',                  quantity: 800,     currency: 'CAD', bookValue: 16932.00,  marketPrice: 150.88,  marketValue: 120704.00, unrealizedGain: 103772.00, assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'CNQ',      yahooSymbol: getYahooSymbol('CNQ','CAD'),      name: 'CANADIAN NATURAL RESOURCES LTD',                quantity: 800,     currency: 'CAD', bookValue: 11966.89,  marketPrice: 61.75,   marketValue: 49400.00,  unrealizedGain: 37433.11,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'CVE',      yahooSymbol: getYahooSymbol('CVE','CAD'),      name: 'CENOVUS ENERGY INC',                            quantity: 300,     currency: 'CAD', bookValue: 7951.00,   marketPrice: 39.81,   marketValue: 11943.00,  unrealizedGain: 3992.00,   assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'C',        yahooSymbol: getYahooSymbol('C','USD'),        name: 'CITIGROUP INC COM',                             quantity: 20,      currency: 'USD', bookValue: 1314.00,   marketPrice: 125.85,  marketValue: 2517.00,   unrealizedGain: 1203.00,   assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'LLY',      yahooSymbol: getYahooSymbol('LLY','USD'),      name: 'ELI LILLY AND CO',                              quantity: 100,     currency: 'USD', bookValue: 5206.86,   marketPrice: 966.99,  marketValue: 96699.00,  unrealizedGain: 91492.14,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'GE',       yahooSymbol: getYahooSymbol('GE','USD'),       name: 'GE AEROSPACE COMMON STOCK',                     quantity: 50,      currency: 'USD', bookValue: 11287.75,  marketPrice: 300.77,  marketValue: 15038.50,  unrealizedGain: 3750.75,   assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'GEHC',     yahooSymbol: getYahooSymbol('GEHC','USD'),     name: 'GE HEALTHCARE TECHNOLOGIES INC COMMON STOCK',   quantity: 16,      currency: 'USD', bookValue: 896.47,    marketPrice: 61.70,   marketValue: 987.20,    unrealizedGain: 90.73,     assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'GEV',      yahooSymbol: getYahooSymbol('GEV','USD'),      name: 'GE VERNOVA INC COMMON STOCK',                   quantity: 12,      currency: 'USD', bookValue: 1672.67,   marketPrice: 1073.08, marketValue: 12876.96,  unrealizedGain: 11204.29,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'GS',       yahooSymbol: getYahooSymbol('GS','USD'),       name: 'GOLDMAN SACHS GROUP INC',                       quantity: 30,      currency: 'USD', bookValue: 9397.87,   marketPrice: 944.86,  marketValue: 28345.80,  unrealizedGain: 18947.93,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'HSBC',     yahooSymbol: getYahooSymbol('HSBC','USD'),     name: 'HSBC HOLDINGS PLC SPONSORED ADR',               quantity: 180,     currency: 'USD', bookValue: 9631.03,   marketPrice: 90.55,   marketValue: 16299.00,  unrealizedGain: 6667.97,   assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'IGM',      yahooSymbol: getYahooSymbol('IGM','CAD'),      name: 'IGM FINANCIAL INC',                             quantity: 300,     currency: 'CAD', bookValue: 11649.98,  marketPrice: 77.15,   marketValue: 23145.00,  unrealizedGain: 11495.02,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'IBM',      yahooSymbol: getYahooSymbol('IBM','USD'),      name: 'INTERNATIONAL BUSINESS MACHINES CORP',          quantity: 74,      currency: 'USD', bookValue: 11791.14,  marketPrice: 223.55,  marketValue: 16542.70,  unrealizedGain: 4751.56,   assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'XEF',      yahooSymbol: getYahooSymbol('XEF','CAD'),      name: 'ISHARES CORE MSCI EAFE IMI INDEX ETF UNIT',     quantity: 240,     currency: 'CAD', bookValue: 10154.88,  marketPrice: 49.99,   marketValue: 11997.60,  unrealizedGain: 1842.72,   assetType: 'etf' },
      { portfolioId: p5.id, symbol: 'XMC',      yahooSymbol: getYahooSymbol('XMC','CAD'),      name: 'ISHARES S&P U S MID CAP INDEX ETF UNIT',        quantity: 240,     currency: 'CAD', bookValue: 7724.12,   marketPrice: 38.68,   marketValue: 9283.20,   unrealizedGain: 1559.08,   assetType: 'etf' },
      { portfolioId: p5.id, symbol: 'IHI',      yahooSymbol: getYahooSymbol('IHI','USD'),      name: 'ISHARES U S MEDICAL DEVICES ETF',               quantity: 240,     currency: 'USD', bookValue: 8190.00,   marketPrice: 47.55,   marketValue: 11412.00,  unrealizedGain: 3222.00,   assetType: 'etf' },
      { portfolioId: p5.id, symbol: 'L',        yahooSymbol: getYahooSymbol('L','CAD'),        name: 'LOBLAW COMPANIES LTD',                          quantity: 800,     currency: 'CAD', bookValue: 10734.71,  marketPrice: 59.04,   marketValue: 47232.00,  unrealizedGain: 36497.29,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'LMT',      yahooSymbol: getYahooSymbol('LMT','USD'),      name: 'LOCKHEED MARTIN CORP',                          quantity: 30,      currency: 'USD', bookValue: 12843.51,  marketPrice: 512.25,  marketValue: 15367.50,  unrealizedGain: 2523.99,   assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'LOW',      yahooSymbol: getYahooSymbol('LOW','USD'),      name: 'LOWES COMPANIES INC',                           quantity: 130,     currency: 'USD', bookValue: 9021.01,   marketPrice: 226.06,  marketValue: 29387.80,  unrealizedGain: 20366.79,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'MFC',      yahooSymbol: getYahooSymbol('MFC','CAD'),      name: 'MANULIFE FINANCIAL CORP',                       quantity: 500,     currency: 'CAD', bookValue: 10707.05,  marketPrice: 54.66,   marketValue: 27330.00,  unrealizedGain: 16622.95,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'MA',       yahooSymbol: getYahooSymbol('MA','USD'),       name: 'MASTERCARD INCORPORATED',                       quantity: 50,      currency: 'USD', bookValue: 14815.82,  marketPrice: 497.81,  marketValue: 24890.50,  unrealizedGain: 10074.68,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'NKE',      yahooSymbol: getYahooSymbol('NKE','USD'),      name: 'NIKE INC CLASS B COM',                          quantity: 130,     currency: 'USD', bookValue: 10636.00,  marketPrice: 42.39,   marketValue: 5510.70,   unrealizedGain: -5125.30,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'ORCL',     yahooSymbol: getYahooSymbol('ORCL','USD'),     name: 'ORACLE CORPORATION',                            quantity: 600,     currency: 'USD', bookValue: 7596.47,   marketPrice: 193.84,  marketValue: 116304.00, unrealizedGain: 108707.53, assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'OVV',      yahooSymbol: getYahooSymbol('OVV','CAD'),      name: 'OVINTIV INC COMMON STOCK',                      quantity: 60,      currency: 'CAD', bookValue: 8442.81,   marketPrice: 79.57,   marketValue: 4774.20,   unrealizedGain: -3668.61,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'PSKY',     yahooSymbol: getYahooSymbol('PSKY','USD'),     name: 'PARAMOUNT SKYDANCE CORPORATION CLASS B COMMON STOCK', quantity: 62, currency: 'USD', bookValue: 727.88,  marketPrice: 10.90,   marketValue: 675.80,    unrealizedGain: -52.08,    assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'PEP',      yahooSymbol: getYahooSymbol('PEP','USD'),      name: 'PEPSICO INC COMMON STOCK',                      quantity: 150,     currency: 'USD', bookValue: 8110.50,   marketPrice: 149.41,  marketValue: 22411.50,  unrealizedGain: 14301.00,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'PFE',      yahooSymbol: getYahooSymbol('PFE','USD'),      name: 'PFIZER INC',                                    quantity: 200,     currency: 'USD', bookValue: 3458.00,   marketPrice: 25.81,   marketValue: 5162.00,   unrealizedGain: 1704.00,   assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'POW',      yahooSymbol: getYahooSymbol('POW','CAD'),      name: 'POWER CORP OF CANADA SUB-VTG',                  quantity: 315,     currency: 'CAD', bookValue: 10956.49,  marketPrice: 78.41,   marketValue: 24699.15,  unrealizedGain: 13742.66,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'QSR',      yahooSymbol: getYahooSymbol('QSR','CAD'),      name: 'RESTAURANT BRANDS INTERNATIONAL INC COM',       quantity: 98,      currency: 'CAD', bookValue: 8040.90,   marketPrice: 107.00,  marketValue: 10486.00,  unrealizedGain: 2445.10,   assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'SPGI',     yahooSymbol: getYahooSymbol('SPGI','USD'),     name: 'S&P GLOBAL INC COM',                            quantity: 20,      currency: 'USD', bookValue: 9913.80,   marketPrice: 421.00,  marketValue: 8420.00,   unrealizedGain: -1493.80,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'SRU.UN',   yahooSymbol: getYahooSymbol('SRU.UN','CAD'),   name: 'SMARTCENTRES REAL ESTATE INVESTMENT TRUST VAR VTG UNIT', quantity: 360, currency: 'CAD', bookValue: 7615.81, marketPrice: 28.40, marketValue: 10224.00, unrealizedGain: 2608.19,  assetType: 'reit' },
      { portfolioId: p5.id, symbol: 'SBUX',     yahooSymbol: getYahooSymbol('SBUX','USD'),     name: 'STARBUCKS CORP',                                quantity: 200,     currency: 'USD', bookValue: 11421.61,  marketPrice: 105.74,  marketValue: 21148.00,  unrealizedGain: 9726.39,   assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'SU',       yahooSymbol: getYahooSymbol('SU','CAD'),       name: 'SUNCOR ENERGY INC',                             quantity: 1012,    currency: 'CAD', bookValue: 27354.52,  marketPrice: 88.88,   marketValue: 89946.56,  unrealizedGain: 62592.04,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'SUNC',     yahooSymbol: getYahooSymbol('SUNC','CAD'),     name: 'SUNOCOCORP LLC COMMON UNITS REPRESENTING',      quantity: 162.155, currency: 'CAD', bookValue: 11380.53,  marketPrice: 90.40,   marketValue: 14658.47,  unrealizedGain: 3277.94,   assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'TRI',      yahooSymbol: getYahooSymbol('TRI','CAD'),      name: 'THOMSON REUTERS CORP COM NO PAR 2026',          quantity: 171,     currency: 'CAD', bookValue: 5356.74,   marketPrice: 121.25,  marketValue: 20733.75,  unrealizedGain: 15377.01,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'TD',       yahooSymbol: getYahooSymbol('TD','CAD'),       name: 'TORONTO-DOMINION BANK',                         quantity: 150,     currency: 'CAD', bookValue: 11975.29,  marketPrice: 146.25,  marketValue: 21937.50,  unrealizedGain: 9962.21,   assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'VZ',       yahooSymbol: getYahooSymbol('VZ','USD'),       name: 'VERIZON COMMUNICATIONS',                        quantity: 250,     currency: 'USD', bookValue: 11799.52,  marketPrice: 47.23,   marketValue: 11807.50,  unrealizedGain: 7.98,      assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'WCP',      yahooSymbol: getYahooSymbol('WCP','CAD'),      name: 'WHITECAP RESOURCES INC',                        quantity: 124,     currency: 'CAD', bookValue: 4826.49,   marketPrice: 15.98,   marketValue: 1981.52,   unrealizedGain: -2844.97,  assetType: 'stock' },
      { portfolioId: p5.id, symbol: 'EDG1001',  yahooSymbol: 'EDG1001',                        name: 'EDGEPOINT GLOBAL PORTFOLIO SR A',               quantity: 963.669, currency: 'CAD', bookValue: 30082.28,  marketPrice: 40.522,  marketValue: 39049.80,  unrealizedGain: 8967.52,   assetType: 'mutual_fund' },
      { portfolioId: p5.id, symbol: 'FID253',   yahooSymbol: 'FID253',                         name: 'FIDELITY NORTHSTAR FUND ISC',                   quantity: 251.479, currency: 'CAD', bookValue: 7305.32,   marketPrice: 35.457,  marketValue: 8916.68,   unrealizedGain: 1611.36,   assetType: 'mutual_fund' },
      { portfolioId: p5.id, symbol: 'MFC2710',  yahooSymbol: 'MFC2710',                        name: 'MACKENZIE GLOBAL DIVIDEND FD SR A',             quantity: 851.452, currency: 'CAD', bookValue: 21848.85,  marketPrice: 39.528,  marketValue: 33656.19,  unrealizedGain: 11807.34,  assetType: 'mutual_fund' },
    ],
  });

  console.log('Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
