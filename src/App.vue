<script setup>
import { ref, computed } from "vue";
import feeTemplate from "./fee.xlsx";
import XlsxTemplate from "xlsx-template-compact";
import fs from "file-saver";
import axios from "axios";
import Model from "@xiangnanscu/model";

const FeeItecnodel = Model.makeClass({
  tableName: "FeeItem",
  abstract: true,
  fields: {
    name: { label: "姓名" },
  },
});
const FeeModel = Model.makeClass({
  abstract: true,
  tableName: "Fee",
  fields: {
    item: { label: "条目", model: FeeItecnodel },
  },
});

const gwy = '王雪莲,王廷江,董文茹,董茂明,项楠,肖宇,蒲洁,魏涛,龙曦,谭港,李意,朱智琦,刘洪,邹宏宇,陈志锐,范敏,唐一铭,李重安,贺鹤泉'.split(',');
const sy = '景明江,杨洁,陈乾,袁良会,熊丽萍,吴开来,罗忠友,曾占梅,雷兰,刘俐,王珏'.split(',');
const users = {
  ...Object.fromEntries(gwy.map(e => [e.trim(), 'g'])),
  ...Object.fromEntries(sy.map(e => [e.trim(), 's']))
};
console.log(Object.keys(users).length)
function s2ab(s) {
  var buf = new ArrayBuffer(s.length);
  var view = new Uint8Array(buf);
  for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
  return buf;
}

function templateToFile({ template, filename, table }) {
  var bin = "";
  var bytes = new Uint8Array(template);
  var length = bytes.byteLength;
  for (var i = 0; i < length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  var tbin = new XlsxTemplate(bin);
  for (const sht of tbin.sheets) {
    tbin.substitute(sht.name, table);
  }
  var data = tbin.generate();
  if (filename.slice(-5) != ".xlsx") {
    filename = filename + ".xlsx";
  }
  fs.saveAs(
    new Blob([s2ab(data)], {
      type: "application/octet-stream",
    }),
    filename
  );
}
const makeItem = () => ({
  // start_year: "",
  // start_month: "",
  // start_day: "",
  start_date: "",
  start_address: "",
  // end_year: "",
  // end_month: "",
  // end_day: "",
  end_date: "",
  end_address: "",
  // days: 0,
  reason: "",
  bzf_bz: 0,
  bzf_je: 0,
  zf_bz: 0,
  zf_je: 0,
  ccf_lb: "",
  ccf_zs: "",
  ccf_je: "",
  zqf_days: "",
  zqf_bz: "",
  zqf_je: "",
  sf_zs: "",
  sf_je: "",
  i: "",
});

const inputValue = ref(`项楠|2022.6.3|江安|2022.6.3|宜宾|报送资料
项楠|2022.6.10|江安|2022.6.10|阳春|报送资料
董茂明,杨洁,项楠|2022.7.4|江安|2022.7.5|宜宾|事业公招体检第二批
项楠|2022.5.3|江安|2022.5.3|成都|公招考察`);

const getFeeStandard = (address, flag) => {
  if (/^宜宾市?$/.test(address)) {
    return flag == 'g' ? { bzf_bz: 80, zf_bz: 20 } : { bzf_bz: 80, zf_bz: 40 };
  } else if (/^(叙州|翠屏|南溪|长宁|三江新|临港|高|珙|筠连|屏山|兴文)[区县]?$/.test(address)) {
    return flag == 'g' ? { bzf_bz: 80, zf_bz: 20 } : { bzf_bz: 80, zf_bz: 40 };
  } else if (/^(江安|下长|阳春|铁清|四面山|怡乐|留耕|夕佳山|大妙|仁和|大井|红桥|五矿|迎安)镇?$/.test(address)) {
    return { bzf_bz: 50, zf_bz: 0 };
  } else if (/^(成都|泸州|广元|遂宁|南充|达州|攀枝花|眉山|广安|雅安|巴中|内江|乐山|资阳|自贡|德阳|绵阳)市?$/.test(address)) {
    return flag == 'g' ? { bzf_bz: 100, zf_bz: 25 } : { bzf_bz: 100, zf_bz: 50 };
  } else {
    throw `无法识别地址"${address}",规则举例: 1. 区县: 翠屏区, 长宁, 三江新区; 2. 乡镇: 阳春, 四面山; 3.市: 宜宾, 成都`;
  }
};
const getDate = (s) => {
  const d = new Date(s)
  if (!(d instanceof Date && !isNaN(d.valueOf()))) {
    throw `日期不正确:${s}`
  }
  return d
}
const ONE_DAY = 1000 * 60 * 60 * 24
const parseItem = line => {
  const [nameString, ...ia] = line.split('|');
  const rawItem = makeItem();
  const item = Object.fromEntries(Object.keys(rawItem).map((e, i) => [e, ia[i] || rawItem[e]]));
  const names = nameString.split(/[,、，]/);
  const sd = getDate(item.start_date)
  const ed = getDate(item.end_date)
  const days = Math.abs((sd - ed) / ONE_DAY) + 1;
  const target_address = /江安县?/.test(item.end_address) ? item.start_address : item.end_address;
  const bzfSet = new Set();
  const zfSet = new Set();
  for (const name of names) {
    let flag = users[name];
    if (!flag) {
      throw `找不到职工"${name}"`;
    }
    const { bzf_bz, zf_bz } = getFeeStandard(target_address, flag);
    item.bzf_je += bzf_bz * days;
    item.zf_je += zf_bz * days;
    bzfSet.add(bzf_bz);
    zfSet.add(zf_bz);
  }
  item.bzf_bz = Array.from(bzfSet).sort().join('/');
  item.zf_bz = Array.from(zfSet).sort().join('/');
  item.total = item.bzf_je + item.zf_je;
  item.names = names;
  // item.start_date = `${item.start_year}.${item.start_month}.${item.start_day}`;
  // item.end_date = item.start_year === item.end_year ? `${item.end_month}.${item.end_day}` : `${item.end_year}.${item.end_month}.${item.end_day}`;
  if (sd.getFullYear() == ed.getFullYear()) {
    item.end_date = `${ed.getMonth() + 1}.${ed.getDate()}`
  }
  item.date = `${item.start_date}—${item.end_date}`;
  item.address = `${item.start_address}—${item.end_address}`;
  item.days = days
  return item;
};

const ChineseMoneyMap = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const getCnNumberList = (acc) => {
  const cn = [];
  for (let i = 3; i > -1; i--) {
    const unit = 10 ** i;
    const n = Math.floor(acc / unit);
    cn.push(ChineseMoneyMap[n]);
    acc = acc - n * unit;
  }
  return cn;
};
function download(event) {
  const items = [];
  for (const line of inputValue.value.split('\n')) {
    const cline = line.replaceAll(/\s/g, "")
    if (!cline) {
      continue
    }
    const item = parseItem(cline);
    items.push(item);
  }
  const names = items.flatMap(e => e.names).filter((e, i, a) => a.indexOf(e) === i).join(',');
  const total = items.map(e => e.total).reduce((x, y) => x + y);
  const n = items.length;
  for (let i = 0; i < 6 - n; i++) {
    items.push({});
  }
  if (total > 9999) {
    throw `总金额${total}已大于9999元,请检查出差总天数${items.filter(e => e.days).map(e => e.days).reduce((x, y) => x + y)}是否正确`;
  }
  const cn = getCnNumberList(total);
  const now = new Date()
  templateToFile({
    template: feeTemplate,
    filename: "差旅费报销明细表",
    table: {
      names,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      qian: cn[0],
      bai: cn[1],
      shi: cn[2],
      yuan: cn[3],
      jiao: "零",
      fen: "零",
      xiaoxie: total,
      t: items,
    },
  });
}
const errorMsg = ref("")
const tryDownload = () => {
  try {
    errorMsg.value = ""
    download()
    console.log("error  not happens")
  } catch (error) {
    console.log("error happens")
    errorMsg.value = error.message || error
  }
}
</script>

<template>
  <div style="width:980px;margin: auto;">
    <span v-if="errorMsg" style=" color:red">{{ errorMsg }}</span>
    <span v-else>仅适用于省内公车出差, 格式: <br />姓名|出发日期|出发地点|抵达日期|抵达地点|出差事由</span>
    <textarea v-model="inputValue" rows="10" class="block" style="font-size:130%"></textarea>
    <button class="block" @click="tryDownload">下载</button>
  </div>
</template>

<style scoped>
a {
  color: #42b983;
}

.block {
  display: block;
  width: 100%;
}
</style>
