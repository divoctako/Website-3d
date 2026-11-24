const models = [
  { id: 'atto-1', name: 'ATTO 1', power: 'EV', photo: true },
  { id: 'atto-2', name: 'ATTO 2', power: 'EV' },
  { id: 'atto-3', name: 'ATTO 3', power: 'EV' },
  { id: 'dolphin', name: 'DOLPHIN', power: 'EV' },
  { id: 'seal-5', name: 'SEAL 5 DM-i', power: 'DM-i' },
  { id: 'seal-6', name: 'SEAL 6', power: 'EV' },
  { id: 'sealion-5', name: 'SEALION 5 DM-i', power: 'DM-i', photo: true },
  { id: 'sealion-6', name: 'SEALION 6 DM-i', power: 'DM-i' },
  { id: 'sealion-7', name: 'SEALION 7', power: 'EV' },
];

// Model detail pages of the combined site (../<slug>/ from here, ./<slug>/ once deployed at the site root).
const detailPages = new Set(['atto-1','atto-2','atto-3','seal-5','seal-6','sealion-5','sealion-6','sealion-7']);
const detailUrl = id => detailPages.has(id) ? './' + id + '/' : null;

// Source: https://www.byd-pi-r.com/promotion-byd
const offers = {
  'atto-1': {prices: {Dynamic:429900, Premium:459900}, rate:1.88, insurance:true, battery:true},
  'atto-2': {prices: {Dynamic:629900, Premium:659900}, rate:1.88, insurance:true, battery:true},
  'atto-3': {prices: {Premium:669900, 'Extended Range':769900}, rate:1.88, insurance:true, freeCharger:true},
  dolphin: {prices: {'Standard Range':509900, 'Extended Range':599900}, rate:1.88, insurance:true, freeCharger:true},
  'seal-5': {prices: {Standard:599900, Dynamic:659900, Premium:699900}, rate:1.88, insurance:true, freeCharger:true, care:true},
  'seal-6': {prices: {Standard:799900, Dynamic:899900, Premium:949900}, rate:1.88, battery:true},
  'sealion-5': {prices: {Dynamic:759900, Premium:799900}, rate:1.98, battery:true, freeCharger:true, care:true},
  'sealion-6': {prices: {Dynamic:859900, Premium:899900}, rate:1.98, insurance:true, freeCharger:true},
  'sealion-7': {prices: {Premium:1199900, 'AWD Performance':1299900}, rate:1.98, insurance:true}
};

const baht = value => value.toLocaleString('th-TH') + ' บาท';
const startingPrice = offer => 'เริ่มต้น ' + baht(Math.min(...Object.values(offer.prices)));
function offerHighlights(offer) {
  return [
    'ดอกเบี้ย ' + offer.rate + '% นาน 48 เดือน',
    offer.care ? 'ฟรีแพ็กเกจบำรุงรักษา BYD Care for DM-i' :
      offer.insurance ? 'ฟรีประกันภัยชั้น 1 และ พ.ร.บ.' : 'รับประกันแบตเตอรี่ 8 ปี หรือ 160,000 กม.',
    offer.freeCharger ? 'ฟรีโฮมชาร์จ ZHIDA' : 'สิทธิ์ซื้อโฮมชาร์จ ZHIDA 10,000 บาท',
    'ฟรี Lifetime Warranty Package'
  ];
}
function offerDetails(offer) {
  return [...new Set([
    ...offerHighlights(offer),
    ...(offer.insurance ? ['ฟรีประกันภัยชั้น 1 และ พ.ร.บ.'] : []),
    (offer.battery ? 'รับประกันแบตเตอรี่' : 'รับประกันคุณภาพ') + ' 8 ปี หรือ 160,000 กม.',
    'ช่วยเหลือฉุกเฉินตลอด 24 ชั่วโมง เป็นเวลา 8 ปี',
    'รับสาย VtoL และสายชาร์จแบบพกพา',
    'รับพรม ผ้ายาง กรอบทะเบียน และฟิล์มหน้าจอกลาง',
    'รับฟิล์มกรองแสง Ceramic XUV MAX III'
  ])];
}
