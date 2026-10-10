// BYD PI-R Motor (พายอาร์ มอเตอร์) branches: contact details and CTA links.
// Leave a link as '' until it is known; the button then shows as "เร็ว ๆ นี้".

export interface Phone {
  label: string;
  number: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phones: Phone[];
  line: string;
  messenger: string;
  map: string;
}

export const COMPANY = 'BYD PI-R Motor';
export const COMPANY_TH = 'พายอาร์ มอเตอร์';

export const BRANCHES: Branch[] = [
  {
    id: 'khonkaen',
    name: 'สาขาขอนแก่น',
    address: '252 หมู่ 12 ถนนมิตรภาพ ตำบลเมืองเก่า อำเภอเมือง ขอนแก่น 40000',
    phones: [
      { label: 'โชว์รูม', number: '043-472293' },
      { label: 'โชว์รูม', number: '043-472294' },
      { label: 'ฝ่ายขาย', number: '093-3193303' },
      { label: 'ศูนย์บริการ', number: '093-3193304' },
    ],
    line: 'https://lin.ee/sQIsasb',
    messenger: '',
    map: 'https://maps.app.goo.gl/ZuqRdBBXH4nRqhtK9',
  },
  {
    id: 'sakonnakhon',
    name: 'สาขาสกลนคร',
    address: '134/10 ถนนใสสว่าง ตำบลธาตุเชิงชุม อำเภอเมือง สกลนคร 47000',
    phones: [
      { label: 'สกลนคร', number: '062-360-2776' },
      { label: 'สว่างแดนดิน', number: '093-319-3290' },
    ],
    line: '',
    messenger: '',
    map: 'https://maps.app.goo.gl/RFfNhwBwo33gtWNcA',
  },
];
